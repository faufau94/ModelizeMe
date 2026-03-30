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

  // Raw (non-Vue-proxied) references to Yjs objects.
  let _rawDoc   = null
  let _rawNodes = null
  let _rawEdges = null

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

    // 5) when sharedNodes changes from REMOTE users, update VueFlow
    //    Skip 'local' origin to avoid resetting positions during/after drag.
    //    Also skip 'init' origin (initial load handled explicitly in page).
    _rawNodes.observe((event, transaction) => {
      if (!mcdStore.flowMCD) return
      if (transaction.origin === 'local' || transaction.origin === 'init') return

      const yNodes = _rawNodes.toArray()
      const yNodeIds = new Set(yNodes.map(n => n.id))

      // Remote changes: update in-place to preserve dimensions/handleBounds
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

      nextTick(() => {
        // Remove edges that reference deleted nodes
        const currentEdges = mcdStore.flowMCD.getEdges?.value || []
        const orphanEdgeIds = currentEdges
          .filter(e => !yNodeIds.has(e.source) || !yNodeIds.has(e.target))
          .map(e => e.id)
        if (orphanEdgeIds.length) mcdStore.flowMCD.removeEdges(orphanEdgeIds)
      })
    })

    // 6) similarly for edges - skip local & init changes
    _rawEdges.observe((event, transaction) => {
      if (!mcdStore.flowMCD) return
      if (transaction.origin === 'local' || transaction.origin === 'init') return

      const edges = _rawEdges.toArray()
      mcdStore.flowMCD.setEdges(edges)
      nextTick(() => {
        for (const e of edges) {
          if (e.data && e.id) mcdStore.flowMCD.updateEdgeData(e.id, { ...e.data })
        }
      })
    })

    // 7) track connection status
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

  // ─── HELPERS ───
  // Strip transient VueFlow state before storing in Yjs.
  function stripTransientState(obj) {
    const clean = JSON.parse(JSON.stringify(obj))
    delete clean.selected
    delete clean.dragging
    return clean
  }

  // ─── NODE CRUD ───
  // All local mutations use origin='local' so the observer skips them.
  function addNode(node) {
    const mcdStore = useMCDStore()
    if (mcdStore.flowMCD) mcdStore.flowMCD.addNodes([ node ])
    if (!_rawNodes) return
    const plain = stripTransientState(node)
    _rawDoc.transact(() => {
      _rawNodes.push([ plain ])
    }, 'local')
  }

  function updateNode(nodeId, newData) {
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

  // Position update
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
    const mcdStore = useMCDStore()
    if (mcdStore.flowMCD) mcdStore.flowMCD.removeNodes([ nodeId ])
    if (!_rawNodes) return
    const arr = _rawNodes.toArray()
    const idx = arr.findIndex(n => n.id === nodeId)
    if (idx >= 0) {
      _rawDoc.transact(() => {
        _rawNodes.delete(idx, 1)
      }, 'local')
    }
  }

  // ─── EDGE CRUD ───
  function addEdge(edge) {
    const mcdStore = useMCDStore()
    if (mcdStore.flowMCD) mcdStore.flowMCD.addEdges([ edge ])
    if (!_rawEdges) return
    const plain = stripTransientState(edge)
    _rawDoc.transact(() => {
      _rawEdges.push([ plain ])
    }, 'local')
  }

  function updateEdge(edgeId, newData) {
    if (!_rawEdges) return
    const arr = _rawEdges.toArray()
    const idx = arr.findIndex(e => e.id === edgeId)
    if (idx === -1) return
    const merged = stripTransientState({ ...arr[idx], ...newData })
    _rawDoc.transact(() => {
      _rawEdges.delete(idx, 1)
      _rawEdges.insert(idx, [ merged ])
    }, 'local')
  }

  function removeEdge(edgeId) {
    const mcdStore = useMCDStore()
    if (mcdStore.flowMCD) mcdStore.flowMCD.removeEdges([ edgeId ])
    if (!_rawEdges) return
    const arr = _rawEdges.toArray()
    const idx = arr.findIndex(e => e.id === edgeId)
    if (idx >= 0) {
      _rawDoc.transact(() => {
        _rawEdges.delete(idx, 1)
      }, 'local')
    }
  }

  // ─── BULK SET ─── (e.g. initial load from your database)
  // skipTracking=true uses 'init' origin so observers ignore it
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
    $fetch('/api/models/viewers', {
      method: 'POST',
      body: { modelId, userId, userName, userImage }
    }).catch(() => {})

    heartbeatTimer.value = setInterval(() => {
      $fetch('/api/models/viewers', {
        method: 'POST',
        body: { modelId, userId, userName, userImage }
      }).catch(() => {})
    }, 30_000)
  }

  // ─── CLEANUP ───
  function cleanup() {
    const flowContainer = document.querySelector('.dndflow')
    if (flowContainer) {
      flowContainer.removeEventListener('mousemove', updateCursor)
    }

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
  }
})
