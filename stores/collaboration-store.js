// src/stores/collaboration.js
import { defineStore } from 'pinia'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { ref, computed } from 'vue'
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

  // ─── REACTIVE ACCESSORS ───
  // these computed() functions turn Y.Array → plain JS array
  const nodes = computed(() => sharedNodes.value?.toArray() ?? [])
  const edges = computed(() => sharedEdges.value?.toArray() ?? [])

  // ─── INITIALIZATION ───
  function initialize(flowId, userName, sessionToken) {
    // do nothing if already initialized
    if (ydoc.value) return

    const mcdStore = useMCDStore()
    const config = useRuntimeConfig()
    const wsUrl = config.public.websocketUrl || 'ws://localhost:1234'

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

    // 5) when sharedNodes changes from REMOTE users, update VueFlow
    //    Skip 'local' origin to avoid resetting positions during/after drag
    sharedNodes.value.observe((event, transaction) => {
      if (!mcdStore.flowMCD) return
      if (transaction.origin === 'local') return
      mcdStore.flowMCD.setNodes(nodes.value)
    })

    // 6) similarly for edges — skip local changes
    sharedEdges.value.observe((event, transaction) => {
      if (!mcdStore.flowMCD) return
      if (transaction.origin === 'local') return
      mcdStore.flowMCD.setEdges(edges.value)
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
    const mcdStore = useMCDStore()
    if (mcdStore.flowMCD) mcdStore.flowMCD.setNodes(nodes.value)
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
    const mcdStore = useMCDStore()
    if (mcdStore.flowMCD) mcdStore.flowMCD.setEdges(edges.value)
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
  function setNodes(newNodes) {
    if (!sharedNodes.value) return
    ydoc.value.transact(() => {
      sharedNodes.value.delete(0, sharedNodes.value.length)
      sharedNodes.value.push(newNodes)
    }, 'local')
  }
  function setEdges(newEdges) {
    if (!sharedEdges.value) return
    ydoc.value.transact(() => {
      sharedEdges.value.delete(0, sharedEdges.value.length)
      sharedEdges.value.push(newEdges)
    }, 'local')
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
    if (ydoc.value) {
      ydoc.value.destroy()
    }

    isConnected.value = false
    activeUsers.value = []
    remoteCursors.value = []
    ydoc.value = null
    provider.value = null
    sharedNodes.value = null
    sharedEdges.value = null
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
    removeNode,
    addEdge,
    updateEdge,
    removeEdge,
    setNodes,
    setEdges,
    setupCursorTracking,
    updateCursor
  }
})