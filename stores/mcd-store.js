import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { getStraightPath, useVueFlow } from "@vue-flow/core";
import { v4 as uuidv4 } from "uuid";
import { useMLDStore } from "./mld-store.js";
import { useCollaborationStore } from "~/stores/collaboration-store.js";
import { useUndoRedoStore } from "~/stores/undo-redo-store.js";
import { findFreePosition } from "~/utils/useCollisions.js";
import { applyEvent } from "~/utils/applyEvent.js";

export const useMCDStore = defineStore("flow-mcd", () => {
  // ─── STORE SINGLETONS ───
  // route is used to read the model ID from the URL
  const route = useRoute();
  // collaborationStore holds our single Y.Doc + shared arrays for nodes/edges
  const collaborationStore = useCollaborationStore();

  // ─── LOCAL REFS FOR VUE FLOW & UI STATE ───
  // Will hold the VueFlow instance once set via setFlowInstance(...)
  const flowMCD = ref(null);
  const activeTab = ref("default");
  const isSubMenuVisible = ref(false);
  const elementsMenu = ref(false);
  const models = ref([]);
  const nodeIdSelected = ref(null);
  const edgeIdSelected = ref(null);
  const addNewNode = ref(false);
  const edgeTypes = ref(["smoothstep", "straight", "step", "curve"]);
  const edgeType = ref("straight");
  const foreignObjectHeight = ref(100);
  const isSaving = ref(false);
  const isResolvingCollisions = ref(false);
  const isNewlyCreated = ref(false);

  // Ternary relation selection mode
  const isTernaryMode = ref(false);
  const ternarySelectedNodes = ref([]);

  // Connection drag state — used to highlight valid target nodes
  const isConnecting = ref(false);
  const connectingSourceNodeId = ref(null);
  const connectHoveredNodeId = ref(null);

  // Edge path style: 'bezier' | 'straight' | 'simpleBezier'
  const edgePathStyle = ref('bezier');

  function readFlowCollection(collection) {
    if (Array.isArray(collection?.value)) return collection.value;
    if (typeof collection === "function") return collection() || [];
    if (Array.isArray(collection)) return collection;
    return [];
  }

  function getFlowNodes() {
    if (!flowMCD.value) return [];
    return readFlowCollection(flowMCD.value.getNodes);
  }

  function getFlowEdges() {
    if (!flowMCD.value) return [];
    return readFlowCollection(flowMCD.value.getEdges);
  }

  // ─── EMIT EVENT: single path for all mutations ───
  // Sends events to server, applies locally via Yjs, and pushes to undo stack
  async function emitEvent(idModel, events) {
    const undoRedoStore = useUndoRedoStore()

    // 1. Persist events on server (also does double-write to Model.nodes/edges)
    const result = await $fetch('/api/models/events', {
      method: 'POST',
      body: { modelId: idModel, events }
    })

    // 2. Apply events locally via Yjs for real-time collaboration sync
    for (const evt of events) {
      applyEventToYjs(evt)
    }

    // 3. Push to undo stack
    const undoableEvents = events.filter(e => e.undoable && e.inverse)
    if (undoableEvents.length === 1) {
      undoRedoStore.pushUndoable(undoableEvents[0])
    } else if (undoableEvents.length > 1) {
      undoRedoStore.pushUndoableBatch(undoableEvents)
    }

    return result
  }

  // Apply a single event to VueFlow + Yjs shared arrays.
  // IMPORTANT: Yjs observers skip 'local' transactions, so we MUST also
  // update VueFlow directly for local changes (including undo/redo).
  function applyEventToYjs(evt) {
    switch (evt.type) {
      case 'TABLE_ADDED':
      case 'TABLE_DUPLICATED':
        if (evt.payload.node) {
          collaborationStore.addNode(evt.payload.node)
          // addNode in collaboration-store already calls flowMCD.addNodes
        }
        break

      case 'TABLE_DELETED':
        if (evt.payload.nodeId) {
          collaborationStore.removeNode(evt.payload.nodeId)
          // removeNode in collaboration-store already calls flowMCD.removeNodes
        }
        break

      case 'TABLE_MOVED':
        if (evt.payload.nodeId && flowMCD.value) {
          const node = flowMCD.value.findNode(evt.payload.nodeId)
          if (node) {
            const newPos = { x: evt.payload.x, y: evt.payload.y }
            // Update VueFlow directly so UI reflects the change
            flowMCD.value.updateNode(evt.payload.nodeId, { position: newPos })
            // Sync to Yjs for collaboration
            collaborationStore.updateNodePosition(evt.payload.nodeId, {
              ...node,
              position: newPos
            })
          }
        }
        break

      case 'TABLE_UPDATED':
        if (evt.payload.nodeId && flowMCD.value) {
          const node = flowMCD.value.findNode(evt.payload.nodeId)
          if (node) {
            // Full replacement of data — not a shallow merge.
            // The event payload contains the COMPLETE data snapshot for this state.
            const newData = { ...evt.payload.data }
            // Update VueFlow directly
            flowMCD.value.updateNodeData(evt.payload.nodeId, newData, { replace: true })
            // Sync to Yjs for collaboration
            collaborationStore.updateNode(evt.payload.nodeId, {
              ...node,
              data: newData
            })
          }
        }
        break

      case 'RELATION_ADDED':
        if (evt.payload.edge) {
          collaborationStore.addEdge(evt.payload.edge)
          // addEdge in collaboration-store already calls flowMCD.addEdges
        }
        break

      case 'RELATION_DELETED':
        if (evt.payload.edgeId) {
          collaborationStore.removeEdge(evt.payload.edgeId)
          // removeEdge in collaboration-store already calls flowMCD.removeEdges
        }
        break

      case 'RELATION_UPDATED':
        if (evt.payload.edgeId && flowMCD.value) {
          const edge = flowMCD.value.findEdge(evt.payload.edgeId)
          if (edge) {
            // Full replacement of data for undo correctness
            const newData = { ...evt.payload.data }
            // Update VueFlow directly
            flowMCD.value.updateEdgeData(evt.payload.edgeId, newData, { replace: true })
            // Sync to Yjs for collaboration
            collaborationStore.updateEdge(evt.payload.edgeId, {
              ...edge,
              data: newData
            })
          }
        }
        break

      case 'LAYOUT_APPLIED':
      case 'BATCH_POSITIONS':
        if (evt.payload.positions && flowMCD.value) {
          const currentNodes = getFlowNodes()
          const posMap = new Map(evt.payload.positions.map(p => [p.id, { x: p.x, y: p.y }]))
          const updatedNodes = currentNodes.map(n => {
            const pos = posMap.get(n.id)
            return pos ? { ...n, position: pos } : n
          })
          collaborationStore.setNodes(updatedNodes, true)
          flowMCD.value.setNodes(updatedNodes)
        }
        break

      default:
        break
    }
  }

  // ─── HELPERS TO GENERATE UNIQUE IDS ───
  function getIdNode() {
    return `dndnode_${uuidv4()}_${uuidv4()}`;
  }
  function getIdEdge() {
    return `dndedge_${uuidv4()}_${uuidv4()}`;
  }

  // ─── SET THE VUE FLOW INSTANCE ───
  function setFlowInstance(instance) {
    // Called from a component: `mcdStore.setFlowInstance(useVueFlow(...))`
    flowMCD.value = instance;
    // After storing the instance, we can immediately sync any already-shared nodes/edges:
    // (collaborationStore.shared arrays might already have data if component set them prior)
    // Because collaborationStore.initialize() sets up an observer that does:
    //   mcdStore.flowMCD.setNodes(collaborationStore.nodes)
    // and similarly for edges, we do not need manual syncing here.
  }

  // ─── FACTORY FOR A NEW NODE OBJECT ───
  function createNewNode(position = null) {
    const nodeId = getIdNode();
    // Default: place at viewport center so the node is always visible
    let finalPosition = position;
    if (!finalPosition && flowMCD.value) {
      try {
        const { x, y, zoom } = flowMCD.value.getViewport();
        const el = flowMCD.value.vueFlowRef;
        const w = el?.offsetWidth || 800;
        const h = el?.offsetHeight || 600;
        finalPosition = {
          x: (-x + w / 2) / zoom - 160,
          y: (-y + h / 2) / zoom - 80,
        };
      } catch {
        finalPosition = { x: Math.random() * 500, y: Math.random() * 500 };
      }
    }
    // Avoid overlapping existing nodes
    const defaultSize = { width: 340, height: 160 };
    if (finalPosition && flowMCD.value) {
      const otherNodes = getFlowNodes();
      finalPosition = findFreePosition(finalPosition, defaultSize, otherNodes, flowMCD.value);
    }

    return {
      id: nodeId,
      type: "customEntity",
      position: finalPosition || { x: Math.random() * 500, y: Math.random() * 500 },
      draggable: true,
      selected: false,
      data: {
        name: "",
        hasTimestamps: true,
        usesSoftDeletes: false,
        properties: [
          {
            id: uuidv4(),
            propertyName: "id",
            typeName: "Big Integer",
            isPrimaryKey: true,
            autoIncrement: true,
            isForeignKey: false,
            isNullable: false,
          },
        ],
      },
    };
  }

  // ─── ADD A NODE ───
  async function addNode(idModel, duplicatedNode = null) {
    addNewNode.value = true;

    let newNode = duplicatedNode !== null ? duplicatedNode : createNewNode();

    await emitEvent(idModel, [{
      type: 'TABLE_ADDED',
      payload: { node: newNode },
      inverse: { type: 'TABLE_DELETED', payload: { nodeId: newNode.id } },
      undoable: true
    }])

    isSubMenuVisible.value = true;
    elementsMenu.value = false;
    isNewlyCreated.value = true;
    nodeIdSelected.value = newNode.id;
    addNewNode.value = false;
  }

  // ─── REMOVE A NODE + CONNECTED EDGES ───
  async function removeNode(idModel, idNode) {
    // Capture full node + connected edges BEFORE removing (needed for undo inverse)
    const node = flowMCD.value?.findNode(idNode)
    const connectedEdges = getFlowEdges()
      .filter((e) => e.source === idNode || e.target === idNode)

    // Build batch: TABLE_DELETED + N × RELATION_DELETED
    const events = []

    // Edge deletions first (so inverse restores them before the node)
    for (const edge of connectedEdges) {
      events.push({
        type: 'RELATION_DELETED',
        payload: { edgeId: edge.id },
        inverse: { type: 'RELATION_ADDED', payload: { edge: { ...edge, selected: false } } },
        undoable: true
      })
    }

    events.push({
      type: 'TABLE_DELETED',
      payload: { nodeId: idNode },
      inverse: node
        ? { type: 'TABLE_ADDED', payload: { node: { ...node, selected: false, dragging: false } } }
        : null,
      undoable: true
    })

    await emitEvent(idModel, events)

    isSubMenuVisible.value = false;
  }

  // ─── UPDATE A NODE ───
  // previousData: snapshot of node.data BEFORE the UI mutation (for undo inverse)
  // Callers MUST capture previousData before modifying the node in the UI.
  async function updateNode(idModel, idNode, previousData = null) {
    const node = flowMCD.value.findNode(idNode);
    if (!node) return;

    await emitEvent(idModel, [{
      type: 'TABLE_UPDATED',
      payload: { nodeId: idNode, data: { ...node.data } },
      inverse: previousData
        ? { type: 'TABLE_UPDATED', payload: { nodeId: idNode, data: previousData } }
        : null,
      undoable: !!previousData
    }])
  }

  // ─── UPDATE NODE POSITION (drag-end) ───
  // originalPos = { x, y } captured at drag-start for undo support
  async function updateNodePosition(idModel, idNode, originalPos = null) {
    const node = flowMCD.value.findNode(idNode);
    if (!node) return;

    await emitEvent(idModel, [{
      type: 'TABLE_MOVED',
      payload: { nodeId: idNode, x: node.position.x, y: node.position.y },
      inverse: originalPos
        ? { type: 'TABLE_MOVED', payload: { nodeId: idNode, x: originalPos.x, y: originalPos.y } }
        : null,
      undoable: !!originalPos
    }])
  }

  // ─── DUPLICATE NODE: Create a copy offset by random amount, then re‐use addNode() ───
  async function duplicateNode(props) {
    const maxOffset = 50;
    const positionNewNode = {
      x:
        props.position.x +
        (Math.random() * maxOffset * 2 - maxOffset),
      y:
        props.position.y +
        (Math.random() * maxOffset * 2 - maxOffset),
    };
    let newNode = createNewNode(positionNewNode);
    newNode.data = { ...props.data };

    // addNode already takes care of backend + Yjs
    await addNode(route.params.idModel, newNode);
  }

  // ─── CREATE A NEW EDGE OBJECT (not yet pushed anywhere) ───
  function createNewEdge(params) {
    const newEdgeId = getIdEdge();
    return {
      id: newEdgeId,
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      type: "customEdge",
      updatable: true,
      selectable: true,
      style: null,
      label: "",
      data: {
        name: "",
        sourceCardinality: "",
        targetCardinality: "",
        hasTimestamps: true,
        usesSoftDeletes: false,
        isCIF: false,
        loopbackSide: null,
        properties: [],
      },
    };
  }

  // ─── UPDATE AN EDGE ───
  // previousData: snapshot of edge.data BEFORE the UI mutation (for undo inverse)
  async function updateEdge(idModel, idEdge, previousData = null) {
    const edge = flowMCD.value.findEdge(idEdge);
    if (!edge) return;

    await emitEvent(idModel, [{
      type: 'RELATION_UPDATED',
      payload: { edgeId: idEdge, data: { ...edge.data } },
      inverse: previousData
        ? { type: 'RELATION_UPDATED', payload: { edgeId: idEdge, data: previousData } }
        : null,
      undoable: !!previousData
    }])
  }

  // ─── REMOVE AN EDGE ───
  async function removeEdge(idModel, idEdge) {
    const edge = flowMCD.value?.findEdge(idEdge)

    await emitEvent(idModel, [{
      type: 'RELATION_DELETED',
      payload: { edgeId: idEdge },
      inverse: edge
        ? { type: 'RELATION_ADDED', payload: { edge: { ...edge, selected: false } } }
        : null,
      undoable: true
    }])

    isSubMenuVisible.value = false;
  }

  // ─── REMOVE MULTIPLE ELEMENTS (batch) ───
  async function removeElements(idModel, nodeIds, edgeIds) {
    const events = []

    // Capture full edges for undo inverse
    for (const eid of edgeIds) {
      const edge = flowMCD.value?.findEdge(eid)
      events.push({
        type: 'RELATION_DELETED',
        payload: { edgeId: eid },
        inverse: edge
          ? { type: 'RELATION_ADDED', payload: { edge: { ...edge, selected: false } } }
          : null,
        undoable: true
      })
    }

    // Capture full nodes for undo inverse
    for (const nid of nodeIds) {
      const node = flowMCD.value?.findNode(nid)
      // Also capture edges connected to this node (not already in edgeIds)
      const connectedEdges = getFlowEdges()
        .filter((e) => (e.source === nid || e.target === nid) && !edgeIds.includes(e.id))
      for (const edge of connectedEdges) {
        events.push({
          type: 'RELATION_DELETED',
          payload: { edgeId: edge.id },
          inverse: { type: 'RELATION_ADDED', payload: { edge: { ...edge, selected: false } } },
          undoable: true
        })
      }
      events.push({
        type: 'TABLE_DELETED',
        payload: { nodeId: nid },
        inverse: node
          ? { type: 'TABLE_ADDED', payload: { node: { ...node, selected: false, dragging: false } } }
          : null,
        undoable: true
      })
    }

    await emitEvent(idModel, events)

    isSubMenuVisible.value = false;
  }

  // ─── ADD ASSOCIATION FIELD TO A SELECTED EDGE ───
  async function addAssociation(idModel) {
    const edge = flowMCD.value.findEdge(edgeIdSelected.value);
    if (!edge) return;

    const previousData = JSON.parse(JSON.stringify(edge.data || {}))

    // Locally update the VueFlow edge data
    flowMCD.value.updateEdgeData(edge.id, { hasNodeAssociation: true });

    // Persist via event
    await emitEvent(idModel, [{
      type: 'RELATION_UPDATED',
      payload: { edgeId: edge.id, data: { ...edge.data, hasNodeAssociation: true } },
      inverse: { type: 'RELATION_UPDATED', payload: { edgeId: edge.id, data: previousData } },
      undoable: true
    }])

    isSubMenuVisible.value = true;
    elementsMenu.value = false;
    edgeIdSelected.value = edge.id;
  }

  // ─── ADD NODE + EDGE ON EDGE DROP ───
  async function addNodeAndEdge(idModel, position, sourceNodeId, sourceHandleId) {
    addNewNode.value = true;

    const newNode = createNewNode(position);
    const newEdge = createNewEdge({
      source: sourceNodeId,
      target: newNode.id,
      sourceHandle: sourceHandleId || null,
      targetHandle: null,
    });

    await emitEvent(idModel, [
      {
        type: 'TABLE_ADDED',
        payload: { node: newNode },
        inverse: { type: 'TABLE_DELETED', payload: { nodeId: newNode.id } },
        undoable: true
      },
      {
        type: 'RELATION_ADDED',
        payload: { edge: newEdge },
        inverse: { type: 'RELATION_DELETED', payload: { edgeId: newEdge.id } },
        undoable: true
      }
    ])

    isSubMenuVisible.value = true;
    elementsMenu.value = false;
    isNewlyCreated.value = true;
    nodeIdSelected.value = newNode.id;
    edgeIdSelected.value = null;
    addNewNode.value = false;

    return { node: newNode, edge: newEdge };
  }

  // ─── DETERMINE PROPER HANDLES FOR AN EDGE ───
  function determineHandles(nodeA, nodeB, nodeC) {
    const handles = { sourceHandle: "s4", targetHandle: "s1" };
    const deltaX = nodeB.position.x - nodeA.position.x;
    const deltaY = nodeB.position.y - nodeA.position.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (
        nodeC.position.x > nodeA.position.x &&
        nodeC.position.x < nodeB.position.x
      ) {
        handles.sourceHandle = "s1";
        handles.targetHandle = "s4";
      } else {
        handles.sourceHandle = "s4";
        handles.targetHandle = "s1";
      }
    } else {
      if (
        nodeC.position.y > nodeA.position.y &&
        nodeC.position.y < nodeB.position.y
      ) {
        handles.sourceHandle = "s2";
        handles.targetHandle = "s3";
      } else {
        handles.sourceHandle = "s3";
        handles.targetHandle = "s2";
      }
    }

    return handles;
  }

  // ─── ADD TERNARY RELATION (3 entities + 1 central association node + 3 edges) ───
  async function addTernaryRelation(idModel, nodeIds, name = '') {
    if (!nodeIds || nodeIds.length !== 3) return null;

    const nodes = nodeIds.map((id) => flowMCD.value.findNode(id)).filter(Boolean);
    if (nodes.length !== 3) return null;

    // Compute centroid position for the central node
    const cx = nodes.reduce((s, n) => s + (n.position?.x ?? 0), 0) / 3;
    const cy = nodes.reduce((s, n) => s + (n.position?.y ?? 0), 0) / 3;

    const ternaryNode = {
      id: getIdNode(),
      type: 'ternaryEntity',
      position: { x: cx, y: cy },
      draggable: true,
      selected: false,
      data: {
        name: name || '',
        hasTimestamps: true,
        usesSoftDeletes: false,
        properties: [],
      },
    };

    const newEdges = nodes.map((node) => {
      const e = createNewEdge({
        source: node.id,
        target: ternaryNode.id,
        sourceHandle: 's4',
        targetHandle: null,
      });
      e.data.sourceCardinality = '0,N';
      e.data.targetCardinality = '0,N';
      return e;
    });

    // Build batch: TABLE_ADDED + 3 × RELATION_ADDED
    const events = [
      {
        type: 'TABLE_ADDED',
        payload: { node: ternaryNode },
        inverse: { type: 'TABLE_DELETED', payload: { nodeId: ternaryNode.id } },
        undoable: true
      },
      ...newEdges.map((edge) => ({
        type: 'RELATION_ADDED',
        payload: { edge },
        inverse: { type: 'RELATION_DELETED', payload: { edgeId: edge.id } },
        undoable: true
      }))
    ]

    await emitEvent(idModel, events)

    isSubMenuVisible.value = true;
    nodeIdSelected.value = ternaryNode.id;

    return { node: ternaryNode, edges: newEdges };
  }

  // ─── GET LOOPBACK EDGES FOR A NODE ───
  function getLoopbackEdges(nodeId) {
    return getFlowEdges().filter((e) => e.source === nodeId && e.target === nodeId);
  }

  // ─── GET TERNARY RELATIONS INVOLVING A NODE ───
  function getTernaryRelations(nodeId) {
    // A node participates in a ternary relation if it has an edge to a ternaryEntity node
    const edges = getFlowEdges().filter(
      (e) => (e.source === nodeId || e.target === nodeId)
    );
    const ternaryNodeIds = new Set();
    for (const e of edges) {
      const otherId = e.source === nodeId ? e.target : e.source;
      const otherNode = flowMCD.value?.findNode(otherId);
      if (otherNode?.type === 'ternaryEntity') ternaryNodeIds.add(otherId);
    }
    return ternaryNodeIds.size;
  }

  // Available sides for loopback edges (order: right, bottom, left, top)
  const LOOPBACK_SIDES = ['right', 'bottom', 'left', 'top'];

  // ─── ADD A SELF-REFERENCING (LOOPBACK) EDGE FROM THE ELEMENT MENU ───
  async function addLoopbackEdge(idModel, nodeId) {
    // Determine which sides are already used
    const existing = getLoopbackEdges(nodeId);
    const usedSides = existing.map((e) => e.data?.loopbackSide).filter(Boolean);
    const freeSide = LOOPBACK_SIDES.find((s) => !usedSides.includes(s));
    if (!freeSide) return null; // Max 4 loopback edges

    const newEdge = createNewEdge({
      source: nodeId,
      target: nodeId,
      sourceHandle: null,
      targetHandle: null,
    });
    newEdge.data.sourceCardinality = '1,1';
    newEdge.data.targetCardinality = '1,1';
    newEdge.data.loopbackSide = freeSide;

    await emitEvent(idModel, [{
      type: 'RELATION_ADDED',
      payload: { edge: newEdge },
      inverse: { type: 'RELATION_DELETED', payload: { edgeId: newEdge.id } },
      undoable: true
    }])

    isSubMenuVisible.value = true;
    elementsMenu.value = false;
    isNewlyCreated.value = true;
    edgeIdSelected.value = newEdge.id;
    nodeIdSelected.value = null;

    return newEdge;
  }

  // ─── ADD A SINGLE EDGE (used by onConnect in the page) ───
  async function addEdge(idModel, params) {
    const newEdge = createNewEdge(params)

    await emitEvent(idModel, [{
      type: 'RELATION_ADDED',
      payload: { edge: newEdge },
      inverse: { type: 'RELATION_DELETED', payload: { edgeId: newEdge.id } },
      undoable: true
    }])

    isSubMenuVisible.value = true;
    elementsMenu.value = false;
    isNewlyCreated.value = true;
    edgeIdSelected.value = newEdge.id;
    nodeIdSelected.value = null;

    return newEdge
  }

  return {
    // Expose reactive state and methods for components to use
    flowMCD,
    activeTab,
    isSubMenuVisible,
    elementsMenu,
    models,
    nodeIdSelected,
    addNewNode,
    edgeType,
    edgeTypes,
    foreignObjectHeight,
    edgeIdSelected,
    isSaving,
    isResolvingCollisions,
    isNewlyCreated,
    isTernaryMode,
    ternarySelectedNodes,
    edgePathStyle,
    isConnecting,
    connectingSourceNodeId,
    connectHoveredNodeId,

    getIdNode,
    getIdEdge,
    setFlowInstance,
    createNewNode,
    createNewEdge,
    readFlowCollection,
    getFlowNodes,
    getFlowEdges,
    emitEvent,

    addNode,
    removeNode,
    updateNode,
    updateNodePosition,
    duplicateNode,
    removeElements,

    addEdge,
    updateEdge,
    removeEdge,
    addNodeAndEdge,
    addAssociation,
    addTernaryRelation,
    addLoopbackEdge,
    getLoopbackEdges,
    getTernaryRelations,
    LOOPBACK_SIDES,
    determineHandles,
  };
});