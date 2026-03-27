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
  let undoRedoResetTimer = null       // debounce timer for isUndoRedoing flag

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
    ydoc.value = new Y.Doc()

    // 2) open a websocket to your Yjs server with auth token
    provider.value = new WebsocketProvider(
      `${wsUrl}?token=${sessionToken || ''}`,
      'flow-' + flowId, // room name
      ydoc.value
    )

    // 3) create or retrieve two shared arrays
    sharedNodes.value = ydoc.value.getArray('nodes')
    sharedEdges.value = ydoc.value.getArray('edges')

    // 4) set up awareness (cursor + name + color)
    const awareness = provider.value.awareness

    awareness.setLocalStateField('user', {
      name: userName,
      color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0'),
      cursor: null
    })

    // 5) when sharedNodes changes from REMOTE users or undo/redo, update VueFlow
    //    Skip 'local' origin to avoid resetting positions during/after drag.
    //    Read toArray() directly — Vue computed won't detect Y.Array internal mutations.
    sharedNodes.value.observe((event, transaction) => {
      if (!mcdStore.flowMCD) return
      if (transaction.origin === 'local') return
      const nodes = sharedNodes.value.toArray()
      mcdStore.flowMCD.setNodes(nodes)
      // Force VueFlow to detect deep data changes (renames, properties, etc.)
      nextTick(() => {
        for (const n of nodes) {
          if (n.data && n.id) mcdStore.flowMCD.updateNodeData(n.id, { ...n.data })
        }
      })
    })

    // 6) similarly for edges — skip local changes
    sharedEdges.value.observe((event, transaction) => {
      if (!mcdStore.flowMCD) return
      if (transaction.origin === 'local') return
      const edges = sharedEdges.value.toArray()
      mcdStore.flowMCD.setEdges(edges)
      // Force VueFlow to detect deep data changes (cardinalities, properties, etc.)
      nextTick(() => {
        for (const e of edges) {
          if (e.data && e.id) mcdStore.flowMCD.updateEdgeData(e.id, { ...e.data })
        }
      })
    })

    // 7) Setup UndoManager — tracks only 'local' origin transactions
    //    Undo/redo transactions have origin = undoManager instance (not 'local'),
    //    so observers will fire and resync VueFlow automatically.
    undoManager.value = new Y.UndoManager(
      [sharedNodes.value, sharedEdges.value],
      {
        trackedOrigins: new Set(['local']),
        captureTimeout: 500,
        maxUndoSteps: 100
      }
    )

    const updateUndoRedoState = () => {
      canUndo.value = undoManager.value?.canUndo() ?? false
      canRedo.value = undoManager.value?.canRedo() ?? false
    }

    undoManager.value.on('stack-item-added', updateUndoRedoState)
    undoManager.value.on('stack-item-popped', () => {
      updateUndoRedoState()
      // Resync DB after undo/redo (debounced to avoid race conditions)
      if (currentModelId.value) {
        clearTimeout(dbSyncTimer)
        dbSyncTimer = setTimeout(() => {
          $fetch('/api/models/sync', {
            method: 'PUT',
            body: {
              id: currentModelId.value,
              nodes: sharedNodes.value?.toArray() ?? [],
              edges: sharedEdges.value?.toArray() ?? []
            }
          }).catch(() => {})
        }, 1000)
      }
    })

    // 8) track connection status
    provider.value.on('status', ({ status }) => {
      isConnected.value = (status === 'connected')
    })

    // 8) track awareness changes for remote cursors / user list
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

  // ─── NODE CRUD ───
  // All local mutations use origin='local' so the observer skips them
  function addNode(node) {
    const mcdStore = useMCDStore()
    // Always add directly to VueFlow immediately (no waiting for Yjs sync)
    if (mcdStore.flowMCD) mcdStore.flowMCD.addNodes([ node ])
    // Also persist in Yjs for collaboration
    if (!sharedNodes.value) return
    ydoc.value.transact(() => {
      sharedNodes.value.push([ node ])
    }, 'local')
  }

  function updateNode(nodeId, newData) {
    if (!sharedNodes.value) return
    const arr = sharedNodes.value.toArray()
    const idx = arr.findIndex(n => n.id === nodeId)
    if (idx === -1) return
    const merged = { ...arr[idx], ...newData }

    ydoc.value.transact(() => {
      sharedNodes.value.delete(idx, 1)
      sharedNodes.value.insert(idx, [merged])
    }, 'local')
  }

  function removeNode(nodeId) {
    const mcdStore = useMCDStore()
    if (mcdStore.flowMCD) mcdStore.flowMCD.removeNodes([ nodeId ])
    if (!sharedNodes.value) return
    const arr = sharedNodes.value.toArray()
    const idx = arr.findIndex(n => n.id === nodeId)
    if (idx >= 0) {
      ydoc.value.transact(() => {
        sharedNodes.value.delete(idx, 1)
      }, 'local')
    }
  }

  // ─── EDGE CRUD ───
  function addEdge(edge) {
    const mcdStore = useMCDStore()
    // Always add directly to VueFlow immediately
    if (mcdStore.flowMCD) mcdStore.flowMCD.addEdges([ edge ])
    // Also persist in Yjs for collaboration
    if (!sharedEdges.value) return
    ydoc.value.transact(() => {
      sharedEdges.value.push([ edge ])
    }, 'local')
  }

  function updateEdge(edgeId, newData) {
    if (!sharedEdges.value) return
    const arr = sharedEdges.value.toArray()
    const idx = arr.findIndex(e => e.id === edgeId)
    if (idx === -1) return
    const merged = { ...arr[idx], ...newData }
    ydoc.value.transact(() => {
      sharedEdges.value.delete(idx, 1)
      sharedEdges.value.insert(idx, [ merged ])
    }, 'local')
  }

  function removeEdge(edgeId) {
    const mcdStore = useMCDStore()
    if (mcdStore.flowMCD) mcdStore.flowMCD.removeEdges([ edgeId ])
    if (!sharedEdges.value) return
    const arr = sharedEdges.value.toArray()
    const idx = arr.findIndex(e => e.id === edgeId)
    if (idx >= 0) {
      ydoc.value.transact(() => {
        sharedEdges.value.delete(idx, 1)
      }, 'local')
    }
  }

  // ─── BULK SET ─── (e.g. initial load from your database)
  // skipTracking=true uses 'init' origin so UndoManager ignores it
  function setNodes(newNodes, skipTracking = false) {
    if (!sharedNodes.value) return
    ydoc.value.transact(() => {
      sharedNodes.value.delete(0, sharedNodes.value.length)
      sharedNodes.value.push(newNodes)
    }, skipTracking ? 'init' : 'local')
  }
  function setEdges(newEdges, skipTracking = false) {
    if (!sharedEdges.value) return
    ydoc.value.transact(() => {
      sharedEdges.value.delete(0, sharedEdges.value.length)
      sharedEdges.value.push(newEdges)
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
  function undo() {
    if (!undoManager.value?.canUndo()) return
    isUndoRedoing.value = true
    clearTimeout(undoRedoResetTimer)
    undoManager.value.undo()
    canUndo.value = undoManager.value.canUndo() ?? false
    canRedo.value = undoManager.value.canRedo() ?? false
    // Use a debounced timer — VueFlow emits position changes asynchronously
    // after Yjs observer fires setNodes/setEdges, which can take many ticks.
    undoRedoResetTimer = setTimeout(() => {
      isUndoRedoing.value = false
    }, 300)
  }

  function redo() {
    if (!undoManager.value?.canRedo()) return
    isUndoRedoing.value = true
    clearTimeout(undoRedoResetTimer)
    undoManager.value.redo()
    canUndo.value = undoManager.value.canUndo() ?? false
    canRedo.value = undoManager.value.canRedo() ?? false
    undoRedoResetTimer = setTimeout(() => {
      isUndoRedoing.value = false
    }, 300)
  }

  // Run multiple Yjs mutations as a single undoable transaction
  function runInTransaction(fn) {
    if (!ydoc.value) return fn()
    ydoc.value.transact(() => { fn() }, 'local')
  }

  // ─── CLEANUP ───
  function cleanup() {
    const flowContainer = document.querySelector('.dndflow')
    if (flowContainer) {
      flowContainer.removeEventListener('mousemove', updateCursor)
    }
    clearTimeout(dbSyncTimer)
    dbSyncTimer = null
    clearTimeout(undoRedoResetTimer)
    undoRedoResetTimer = null
    undoManager.value = null
    canUndo.value = false
    canRedo.value = false
    isUndoRedoing.value = false
    if (provider.value) {
      provider.value.awareness.setLocalStateField('user', null)
      provider.value.destroy()
    }
    if (ydoc.value) {
      ydoc.value.destroy()
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
    runInTransaction
  }
})