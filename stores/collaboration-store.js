// src/stores/collaboration.js
import { defineStore } from 'pinia'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { ref, computed } from 'vue'
import { useMCDStore } from './mcd-store'
import { useSession } from '~/lib/auth-client'

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
  function initialize(flowId, userName) {
    // do nothing if already initialized
    if (ydoc.value) return

    const mcdStore = useMCDStore()

    // 1) create exactly one Y.Doc
    ydoc.value = new Y.Doc()

    // 2) open a websocket to your Yjs server
    provider.value = new WebsocketProvider(
      'ws://localhost:1234',
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

    // 5) when sharedNodes changes anywhere, let MCDStore update the Vue Flow instance
    sharedNodes.value.observe((event) => {
      console.log('🔄 Yjs: nodes changed event →', event)
      console.log('🔄 Yjs: nodes changed →', nodes.value)
      console.log('event.transaction.origin: ', event.transaction.origin)
      if (!mcdStore.flowMCD || nodes.value.length === 0 || event.transaction.origin === 'local') return
      console.log('On arrive ici !')
      // set VueFlow to exactly the current array of nodes
      mcdStore.flowMCD.setNodes(nodes.value)
    })

    // 6) similarly for edges
    sharedEdges.value.observe(() => {
      console.log('🔄 Yjs: edges changed →', edges.value)
      if (!mcdStore.flowMCD) return
      mcdStore.flowMCD.setEdges(edges.value)
    })

    // 7) track connection status
    provider.value.on('status', ({ status }) => {
      console.log('Connection status:', status)
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

    // 9) set up event listeners so that if the local user drags/moves a node in Vue Flow,
    //    we immediately write that change back into Yjs.  MCDStore provides onNodesChange/onEdgesChange.
    // if (mcdStore.flowMCD) {
    //   mcdStore.flowMCD.onNodesChange(({ node, type }) => {
    //     if (type === 'position' || type === 'dimensions') {
    //       updateNode(node.id, node)
    //     }
    //   })
    //   mcdStore.flowMCD.onEdgesChange(({ edge, type }) => {
    //     if (type === 'update') {
    //       updateEdge(edge.id, edge)
    //     }
    //   })
    // }
  }

  // ─── NODE CRUD ───
  function addNode(node) {
    console.log('Adding node to Yjs:', node)
    sharedNodes.value?.push([ node ])
  }

  function updateNode(nodeId, newData) {
    if (!sharedNodes.value) return
    const arr = sharedNodes.value.toArray()
    const idx = arr.findIndex(n => n.id === nodeId)
    if (idx === -1) {
      console.warn('Yjs node not found for update:', nodeId)
      return
    }
    // merge old fields with newData, then replace exactly that index
    const merged = { ...arr[idx], ...newData }

    ydoc.value.transact(() => {
      sharedNodes.value.delete(idx, 1)
      sharedNodes.value.insert(idx, [merged])
    }, /* origin= */ 'local')
  }

  function removeNode(nodeId) {
    if (!sharedNodes.value) return
    const arr = sharedNodes.value.toArray()
    const idx = arr.findIndex(n => n.id === nodeId)
    if (idx >= 0) {
      sharedNodes.value.delete(idx, 1)
    }
  }

  // ─── EDGE CRUD ───
  function addEdge(edge) {
    sharedEdges.value?.push([ edge ])
  }

  function updateEdge(edgeId, newData) {
    if (!sharedEdges.value) return
    const arr = sharedEdges.value.toArray()
    const idx = arr.findIndex(e => e.id === edgeId)
    if (idx === -1) return
    const merged = { ...arr[idx], ...newData }
    sharedEdges.value.delete(idx, 1)
    sharedEdges.value.insert(idx, [ merged ])
  }

  function removeEdge(edgeId) {
    if (!sharedEdges.value) return
    const arr = sharedEdges.value.toArray()
    const idx = arr.findIndex(e => e.id === edgeId)
    if (idx >= 0) sharedEdges.value.delete(idx, 1)
  }

  // ─── BULK SET ─── (e.g. initial load from your database)
  function setNodes(newNodes) {
    if (!sharedNodes.value) return
    sharedNodes.value.delete(0, sharedNodes.value.length)
    sharedNodes.value.push(newNodes)
  }
  function setEdges(newEdges) {
    if (!sharedEdges.value) return
    sharedEdges.value.delete(0, sharedEdges.value.length)
    sharedEdges.value.push(newEdges)
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