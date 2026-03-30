// src/stores/collaboration.js
import { defineStore } from 'pinia'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { ref, computed, nextTick } from 'vue'
import { useMCDStore } from './mcd-store'

export const useCollaborationStore = defineStore('collaboration', () => {

  // ─── INTERNAL STATE ───
  const isConnected   = ref(false)
  const activeUsers   = ref([])
  const remoteCursors = ref([])
  const ydoc          = ref(null)     // will hold the single Y.Doc
  const provider      = ref(null)     // will hold the single WebsocketProvider
  const sharedNodes   = ref(null)     // a Y.Array for nodes
  const sharedEdges   = ref(null)     // a Y.Array for edges
  const currentModelId  = ref(null)
  const currentUserId   = ref(null)
  const heartbeatTimer  = ref(null)
  const undoManager     = ref(null)   // Y.UndoManager for undo/redo
  const canUndo         = ref(false)
  const canRedo         = ref(false)
  const isUndoRedoing   = ref(false)  // true while undo/redo is in progress
  let dbSyncTimer       = null        // debounce timer for DB sync after undo/redo
  let _insideTransaction = false      // true when inside runInTransaction
  // Counter: >0 means VueFlow is being updated from Yjs observer (undo/redo/remote).
  // The page's onChange must skip when this is >0 to avoid creating 'local' transactions
  // that would wipe the redo stack.
  let _suppressOnChange = 0
  // Raw (non-Vue-proxied) references to Yjs objects.
  // Vue's reactive proxy around Y.Array/Y.Doc can confuse the UndoManager's scope
  // check (=== comparison fails between proxy and raw). Keep raw refs for all Yjs ops.
  let _rawDoc   = null
  let _rawNodes = null
  let _rawEdges = null
  let _rawUndoManager = null

  // ─── REACTIVE ACCESSORS ───
  // these computed() functions turn Y.Array → plain JS array
  const nodes = computed(() => sharedNodes.value?.toArray() ?? [])
  const edges = computed(() => sharedEdges.value?.toArray() ?? [])

  // ─── INITIALIZATION ───
  function initialize(flowId, userName, sessionToken, userId = null, userImage = null) {
    // cleanup any previous session before re-initializing
    cleanup()

    const mcdStore = useMCDStore()
    const config = useRuntimeConfig()
    const wsUrl = config.public.websocketUrl || 'ws://localhost:1234'

    currentModelId.value = flowId
    currentUserId.value = userId || userName

    // Register this user as viewing the model
    registerViewerHeartbeat(flowId, currentUserId.value, userName, userImage)

    // 1) create exactly one Y.Doc
    _rawDoc = new Y.Doc()
    ydoc.value = _rawDoc

    // 2) open a websocket to your Yjs server with auth token
    provider.value = new WebsocketProvider(
      `${wsUrl}?token=${sessionToken || ''}`,
      'flow-' + flowId, // room name
      _rawDoc
    )

    // 3) create or retrieve two shared arrays
    _rawNodes = _rawDoc.getArray('nodes')
    _rawEdges = _rawDoc.getArray('edges')
    sharedNodes.value = _rawNodes
    sharedEdges.value = _rawEdges

    // 4) set up awareness (cursor + name + color)
    const awareness = provider.value.awareness

    awareness.setLocalStateField('user', {
      name: userName,
      color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0'),
      cursor: null
    })

    // 5) when sharedNodes changes from REMOTE users or undo/redo, update VueFlow
    //    Skip 'local' origin to avoid resetting positions during/after drag.
    //    Also skip 'init' origin (initial load handled explicitly in page).
    //    We increment _suppressOnChange BEFORE touching VueFlow and decrement after
    //    two nextTick cycles, so the page's onChange handler can skip position-change
    //    events that result from this observer (preventing redo-stack wipe).
    _rawNodes.observe((event, transaction) => {
      if (!mcdStore.flowMCD) return
      if (transaction.origin === 'local' || transaction.origin === 'init') return
      _suppressOnChange++
      const yNodes = _rawNodes.toArray()
      const yNodeIds = new Set(yNodes.map(n => n.id))
      const isFromUndoRedo = transaction.origin === _rawUndoManager

      if (isFromUndoRedo) {
        // Undo/redo: full replacement to guarantee data correctness
        mcdStore.flowMCD.setNodes(yNodes)
        nextTick(() => {
          for (const n of yNodes) {
            if (n.data && n.id) mcdStore.flowMCD.updateNodeData(n.id, { ...n.data })
          }
        })
      } else {
        // Remote changes: update in-place to preserve dimensions/handleBounds
        // so edges stay connected
        const currentNodes = mcdStore.flowMCD.getNodes?.value || []
        const currentNodeIds = new Set(currentNodes.map(n => n.id))

        for (const yNode of yNodes) {
          const existing = mcdStore.flowMCD.findNode(yNode.id)
          if (existing) {
            if (yNode.position) {
              mcdStore.flowMCD.updateNode(yNode.id, { position: { ...yNode.position } })
            }
            if (yNode.data) {
              mcdStore.flowMCD.updateNodeData(yNode.id, { ...yNode.data })
            }
          }
        }

        const toAdd = yNodes.filter(n => !currentNodeIds.has(n.id))
        if (toAdd.length) mcdStore.flowMCD.addNodes(toAdd)

        const toRemove = currentNodes.filter(n => !yNodeIds.has(n.id)).map(n => n.id)
        if (toRemove.length) mcdStore.flowMCD.removeNodes(toRemove)
      }

      nextTick(() => {
        // Remove edges that reference deleted nodes (e.g. after undo of addNode)
        const currentEdges = mcdStore.flowMCD.getEdges?.value || []
        const orphanEdgeIds = currentEdges
          .filter(e => !yNodeIds.has(e.source) || !yNodeIds.has(e.target))
          .map(e => e.id)
        if (orphanEdgeIds.length) mcdStore.flowMCD.removeEdges(orphanEdgeIds)
        if (isUndoRedoing.value) syncToDb()
        nextTick(() => { nextTick(() => { nextTick(() => {
          _suppressOnChange = Math.max(0, _suppressOnChange - 1)
        }) }) })
      })
    })

    // 6) similarly for edges - skip local & init changes
    _rawEdges.observe((event, transaction) => {
      if (!mcdStore.flowMCD) return
      if (transaction.origin === 'local' || transaction.origin === 'init') return
      _suppressOnChange++
      const edges = _rawEdges.toArray()
      mcdStore.flowMCD.setEdges(edges)
      nextTick(() => {
        for (const e of edges) {
          if (e.data && e.id) mcdStore.flowMCD.updateEdgeData(e.id, { ...e.data })
        }
        if (isUndoRedoing.value) syncToDb()
        nextTick(() => { nextTick(() => { nextTick(() => {
          _suppressOnChange = Math.max(0, _suppressOnChange - 1)
        }) }) })
      })
    })

    // DEBUG: log ALL transactions to find what wipes the redo stack
    _rawDoc.on('afterTransaction', (transaction) => {
      if (transaction.changed.size === 0) return
      const origin = transaction.origin
      let originStr
      if (origin === null) originStr = 'null'
      else if (origin === 'local') originStr = 'local'
      else if (origin === 'init') originStr = 'init'
      else if (origin === provider.value) originStr = 'WebsocketProvider'
      else if (typeof origin === 'object' && origin?.constructor?.name) originStr = origin.constructor.name
      else originStr = String(origin)
      console.log('[Y.Doc] afterTransaction - origin:', originStr,
        'changed:', transaction.changed.size,
        'isUndoRedoing:', isUndoRedoing.value,
        'origin===undoMgr:', origin === _rawUndoManager)
    })

    // 7) Setup UndoManager - tracks only 'local' origin transactions
    //    Undo/redo transactions have origin = undoManager instance (not 'local'),
    //    so observers will fire and resync VueFlow automatically.
    // CRITICAL: use _rawNodes/_rawEdges (not Vue-proxied refs) so the UndoManager's
    // scope === check matches the raw Y.Arrays from changedParentTypes.
    _rawUndoManager = new Y.UndoManager(
      [_rawNodes, _rawEdges],
      {
        trackedOrigins: new Set(['local']),
        captureTimeout: 500,
        maxUndoSteps: 100
      }
    )
    undoManager.value = _rawUndoManager

    const updateUndoRedoState = () => {
      canUndo.value = _rawUndoManager?.canUndo() ?? false
      canRedo.value = _rawUndoManager?.canRedo() ?? false
    }

    _rawUndoManager.on('stack-item-added', (event) => {
      console.warn('[UndoManager] stack-item-added - type:', event.type,
        'undoing:', _rawUndoManager.undoing,
        'redoing:', _rawUndoManager.redoing,
        'undoStack:', _rawUndoManager.undoStack.length,
        'redoStack:', _rawUndoManager.redoStack.length,
        'suppress:', _suppressOnChange)
      updateUndoRedoState()
    })
    _rawUndoManager.on('stack-item-popped', (event) => {
      console.log('[UndoManager] stack-item-popped - type:', event.type,
        'undoing:', _rawUndoManager.undoing,
        'redoing:', _rawUndoManager.redoing,
        'undoStack:', _rawUndoManager.undoStack.length,
        'redoStack:', _rawUndoManager.redoStack.length)
      updateUndoRedoState()
    })

    // 8) track connection status
    provider.value.on('status', ({ status }) => {
      isConnected.value = (status === 'connected')
    })

    // 9) track awareness changes for remote cursors / user list
    awareness.on('change', () => {
      const states = Array.from(awareness.getStates().entries())
      remoteCursors.value = states
        .filter(([clientId]) => clientId !== ydoc.value.clientID)
        .map(([, state]) => state.user)
        .filter(u => u && u.cursor)

      activeUsers.value = states
        .map(([clientId, state]) => ({
          id: clientId,
          isLocal: clientId === ydoc.value.clientID,
          ...state.user
        }))
        .filter(u => u.name)
    })

  }

  // ─── DB SYNC (debounced) ───
  function syncToDb() {
    if (!currentModelId.value) return
    clearTimeout(dbSyncTimer)
    dbSyncTimer = setTimeout(() => {
      $fetch('/api/models/sync', {
        method: 'PUT',
        body: {
          id: currentModelId.value,
          nodes: _rawNodes?.toArray() ?? [],
          edges: _rawEdges?.toArray() ?? []
        }
      }).catch(() => {})
    }, 1000)
  }

  // ─── HELPERS ───
  // Strip transient VueFlow state before storing in Yjs.
  // selected/dragging are UI-only and must not leak into the CRDT,
  // otherwise undo/redo restores stale selection/drag state.
  function stripTransientState(obj) {
    const clean = JSON.parse(JSON.stringify(obj))
    delete clean.selected
    delete clean.dragging
    return clean
  }

  // ─── NODE CRUD ───
  // All local mutations use origin='local' so the observer skips them.
  // When inside runInTransaction, do NOT touch VueFlow directly - the Yjs
  // observer will handle it after the transaction commits (for undo coherence).
  function addNode(node) {
    if (!_insideTransaction) {
      const mcdStore = useMCDStore()
      if (mcdStore.flowMCD) mcdStore.flowMCD.addNodes([ node ])
    }
    if (!_rawNodes) return
    const plain = stripTransientState(node)
    if (_insideTransaction) {
      _rawNodes.push([ plain ])
    } else {
      _rawDoc.transact(() => {
        _rawNodes.push([ plain ])
      }, 'local')
    }
  }

  function updateNode(nodeId, newData) {
    if (!_rawNodes) return
    const arr = _rawNodes.toArray()
    const idx = arr.findIndex(n => n.id === nodeId)
    if (idx === -1) return
    const merged = stripTransientState({ ...arr[idx], ...newData })

    if (_insideTransaction) {
      _rawNodes.delete(idx, 1)
      _rawNodes.insert(idx, [merged])
    } else {
      _rawDoc.transact(() => {
        _rawNodes.delete(idx, 1)
        _rawNodes.insert(idx, [merged])
      }, 'local')
    }
  }

  // Position update - tracked by UndoManager (origin='local') so drag is undoable.
  // The observer skips 'local' origin, so VueFlow won't be reset during the drag.
  // On undo/redo the observer WILL fire (origin=undoManager) and resync VueFlow.
  function updateNodePosition(nodeId, newData) {
    if (!_rawNodes) return
    const arr = _rawNodes.toArray()
    const idx = arr.findIndex(n => n.id === nodeId)
    if (idx === -1) return
    const merged = stripTransientState({ ...arr[idx], ...newData })
    _rawDoc.transact(() => {
      _rawNodes.delete(idx, 1)
      _rawNodes.insert(idx, [merged])
    }, 'local')
  }

  function removeNode(nodeId) {
    if (!_insideTransaction) {
      const mcdStore = useMCDStore()
      if (mcdStore.flowMCD) mcdStore.flowMCD.removeNodes([ nodeId ])
    }
    if (!_rawNodes) return
    const arr = _rawNodes.toArray()
    const idx = arr.findIndex(n => n.id === nodeId)
    if (idx >= 0) {
      if (_insideTransaction) {
        _rawNodes.delete(idx, 1)
      } else {
        _rawDoc.transact(() => {
          _rawNodes.delete(idx, 1)
        }, 'local')
      }
    }
  }

  // ─── EDGE CRUD ───
  function addEdge(edge) {
    if (!_insideTransaction) {
      const mcdStore = useMCDStore()
      if (mcdStore.flowMCD) mcdStore.flowMCD.addEdges([ edge ])
    }
    if (!_rawEdges) return
    const plain = stripTransientState(edge)
    if (_insideTransaction) {
      _rawEdges.push([ plain ])
    } else {
      _rawDoc.transact(() => {
        _rawEdges.push([ plain ])
      }, 'local')
    }
  }

  function updateEdge(edgeId, newData) {
    if (!_rawEdges) return
    const arr = _rawEdges.toArray()
    const idx = arr.findIndex(e => e.id === edgeId)
    if (idx === -1) return
    const merged = stripTransientState({ ...arr[idx], ...newData })
    if (_insideTransaction) {
      _rawEdges.delete(idx, 1)
      _rawEdges.insert(idx, [ merged ])
    } else {
      _rawDoc.transact(() => {
        _rawEdges.delete(idx, 1)
        _rawEdges.insert(idx, [ merged ])
      }, 'local')
    }
  }

  function removeEdge(edgeId) {
    if (!_insideTransaction) {
      const mcdStore = useMCDStore()
      if (mcdStore.flowMCD) mcdStore.flowMCD.removeEdges([ edgeId ])
    }
    if (!_rawEdges) return
    const arr = _rawEdges.toArray()
    const idx = arr.findIndex(e => e.id === edgeId)
    if (idx >= 0) {
      if (_insideTransaction) {
        _rawEdges.delete(idx, 1)
      } else {
        _rawDoc.transact(() => {
          _rawEdges.delete(idx, 1)
        }, 'local')
      }
    }
  }

  // ─── BULK SET ─── (e.g. initial load from your database)
  // skipTracking=true uses 'init' origin so UndoManager ignores it
  function setNodes(newNodes, skipTracking = false) {
    if (!_rawNodes) return
    const plain = newNodes.map(n => stripTransientState(n))
    _rawDoc.transact(() => {
      _rawNodes.delete(0, _rawNodes.length)
      _rawNodes.push(plain)
    }, skipTracking ? 'init' : 'local')
  }
  function setEdges(newEdges, skipTracking = false) {
    if (!_rawEdges) return
    const plain = newEdges.map(e => stripTransientState(e))
    _rawDoc.transact(() => {
      _rawEdges.delete(0, _rawEdges.length)
      _rawEdges.push(plain)
    }, skipTracking ? 'init' : 'local')
  }

  // ─── CURSOR / AWARENESS ───
  function updateCursor(event) {
    if (!provider.value) return
    const flowContainer = document.querySelector('.dndflow')
    if (!flowContainer) return

    // Get the Vue Flow instance from MCD store
    const mcdStore = useMCDStore()
    if (!mcdStore.flowMCD) return

    // Convert screen coordinates to flow coordinates
    const flowPosition = mcdStore.flowMCD.screenToFlowCoordinate({
      x: event.clientX,
      y: event.clientY
    })

    provider.value.awareness.setLocalStateField('user', {
      ...provider.value.awareness.getLocalState()?.user,
      cursor: flowPosition
    })
  }
  function setupCursorTracking() {
    const flowContainer = document.querySelector('.dndflow')
    if (flowContainer) {
      flowContainer.addEventListener('mousemove', updateCursor)
    }
  }

  // ─── VIEWER HEARTBEAT ───
  function registerViewerHeartbeat(modelId, userId, userName, userImage) {
    // Send initial registration
    $fetch('/api/models/viewers', {
      method: 'POST',
      body: { modelId, userId, userName, userImage }
    }).catch(() => {})

    // Send heartbeat every 30 seconds to keep viewer alive
    heartbeatTimer.value = setInterval(() => {
      $fetch('/api/models/viewers', {
        method: 'POST',
        body: { modelId, userId, userName, userImage }
      }).catch(() => {})
    }, 30_000)
  }

  // ─── UNDO / REDO ───
  function clearUndoHistory() {
    if (!_rawUndoManager) return
    _rawUndoManager.clear()
    canUndo.value = false
    canRedo.value = false
  }

  function undo() {
    if (!_rawUndoManager?.canUndo()) return
    console.log('[undo] BEFORE - undoStack:', _rawUndoManager.undoStack.length,
      'redoStack:', _rawUndoManager.redoStack.length, 'suppress:', _suppressOnChange)
    isUndoRedoing.value = true
    _suppressOnChange++
    const result = _rawUndoManager.undo()
    console.log('[undo] AFTER - result:', result,
      'undoStack:', _rawUndoManager.undoStack.length,
      'redoStack:', _rawUndoManager.redoStack.length,
      'canRedo:', _rawUndoManager.canRedo(),
      'suppress:', _suppressOnChange)
    nextTick(() => { nextTick(() => { nextTick(() => { nextTick(() => { nextTick(() => {
      console.log('[undo] SETTLED - suppress:', _suppressOnChange,
        'canUndo:', canUndo.value, 'canRedo:', canRedo.value,
        'undoStack:', _rawUndoManager?.undoStack.length,
        'redoStack:', _rawUndoManager?.redoStack.length)
      _suppressOnChange = Math.max(0, _suppressOnChange - 1)
      isUndoRedoing.value = false
    }) }) }) }) })
  }

  function redo() {
    if (!_rawUndoManager?.canRedo()) return
    console.log('[redo] BEFORE - undoStack:', _rawUndoManager.undoStack.length,
      'redoStack:', _rawUndoManager.redoStack.length)
    isUndoRedoing.value = true
    _suppressOnChange++
    _rawUndoManager.redo()
    console.log('[redo] AFTER - undoStack:', _rawUndoManager.undoStack.length,
      'redoStack:', _rawUndoManager.redoStack.length,
      'canRedo:', canRedo.value)
    nextTick(() => { nextTick(() => { nextTick(() => { nextTick(() => { nextTick(() => {
      _suppressOnChange = Math.max(0, _suppressOnChange - 1)
      isUndoRedoing.value = false
    }) }) }) }) })
  }

  // Run multiple Yjs mutations as a single undoable transaction.
  // Inside this, CRUD functions skip direct VueFlow calls - the Yjs observer
  // handles VueFlow sync after the transaction, ensuring undo restores everything.
  function runInTransaction(fn) {
    if (!_rawDoc) return fn()
    _insideTransaction = true
    _suppressOnChange++
    try {
      _rawDoc.transact(() => { fn() }, 'local')
    } finally {
      _insideTransaction = false
    }
    // The Yjs observer won't fire for 'local' origin, so sync VueFlow manually.
    // This runs while _suppressOnChange > 0, so the page's onChange won't persist.
    const mcdStore = useMCDStore()
    if (mcdStore.flowMCD) {
      mcdStore.flowMCD.setNodes(_rawNodes?.toArray() ?? [])
      mcdStore.flowMCD.setEdges(_rawEdges?.toArray() ?? [])
    }
    nextTick(() => { nextTick(() => { nextTick(() => {
      _suppressOnChange = Math.max(0, _suppressOnChange - 1)
    }) }) })
  }

  // Expose suppression state for the page's onChange handler
  function isSuppressed() {
    return _suppressOnChange > 0
  }

  // ─── CLEANUP ───
  function cleanup() {
    const flowContainer = document.querySelector('.dndflow')
    if (flowContainer) {
      flowContainer.removeEventListener('mousemove', updateCursor)
    }
    clearTimeout(dbSyncTimer)
    dbSyncTimer = null
    _insideTransaction = false
    _suppressOnChange = 0
    _rawUndoManager = null
    undoManager.value = null
    canUndo.value = false
    canRedo.value = false
    isUndoRedoing.value = false
    if (provider.value) {
      provider.value.awareness.setLocalStateField('user', null)
      provider.value.destroy()
    }
    if (_rawDoc) {
      _rawDoc.destroy()
    }

    // Unregister viewer
    if (currentModelId.value && currentUserId.value) {
      $fetch('/api/models/viewers', {
        method: 'DELETE',
        body: { modelId: currentModelId.value, userId: currentUserId.value }
      }).catch(() => {})
    }
    if (heartbeatTimer.value) {
      clearInterval(heartbeatTimer.value)
      heartbeatTimer.value = null
    }

    isConnected.value = false
    activeUsers.value = []
    remoteCursors.value = []
    _rawDoc = null
    _rawNodes = null
    _rawEdges = null
    ydoc.value = null
    provider.value = null
    sharedNodes.value = null
    sharedEdges.value = null
    currentModelId.value = null
    currentUserId.value = null
  }

  return {
    // public state (refs/computed):
    nodes,
    edges,
    isConnected,
    activeUsers,
    remoteCursors,
    canUndo,
    canRedo,
    isUndoRedoing,

    // actions:
    initialize,
    cleanup,
    addNode,
    updateNode,
    updateNodePosition,
    removeNode,
    addEdge,
    updateEdge,
    removeEdge,
    setNodes,
    setEdges,
    setupCursorTracking,
    updateCursor,
    undo,
    redo,
    runInTransaction,
    syncToDb,
    clearUndoHistory,
    isSuppressed
  }
})