import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { getStraightPath, useVueFlow } from "@vue-flow/core";
import { v4 as uuidv4 } from "uuid";
import { useMLDStore } from "./mld-store.js";
import { useCollaborationStore } from "~/stores/collaboration-store.js";
import { findFreePosition } from "~/utils/useCollisions.js";

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

  // ─── ADD A NODE: Persist to backend, THEN push into Yjs shared array ───
  async function addNode(idModel, duplicatedNode = null) {
    addNewNode.value = true;

    // Create newNode if not duplicating an existing one
    let newNode =
      duplicatedNode !== null ? duplicatedNode : createNewNode();

    // 1) Persist this new node to your own database
    await $fetch(`/api/models/update`, {
      method: "PUT",
      query: { id: idModel },
      body: {
        node: newNode,
        type: "node",
      },
    });

    // 2) Push the new node into the sharedNodes Yjs array.
    //    collaborationStore.addNode also adds to VueFlow directly
    collaborationStore.addNode(newNode);

    // 3) Update UI state
    isSubMenuVisible.value = true;
    elementsMenu.value = false;
    isNewlyCreated.value = true;
    nodeIdSelected.value = newNode.id;
    addNewNode.value = false;
  }

  // ─── REMOVE A NODE + CONNECTED EDGES: single undo transaction ───
  async function removeNode(idModel, idNode) {
    // Find connected edges BEFORE removing, so undo restores them together
    const connectedEdgeIds = getFlowEdges()
      .filter((e) => e.source === idNode || e.target === idNode)
      .map((e) => e.id);

    // 1) Delete node from DB
    await $fetch(`/api/models/delete`, {
      method: "DELETE",
      query: { idModel: idModel, idNode: idNode },
      body: { type: "node", action: "removeNode" },
    });

    // 1b) Delete connected edges from DB
    for (const edgeId of connectedEdgeIds) {
      $fetch(`/api/models/delete`, {
        method: "DELETE",
        query: { idModel: idModel, idEdge: edgeId },
        body: { type: "edge", action: "removeEdge" },
      }).catch(() => {});
    }

    // 2) Remove node + edges from Yjs in ONE transaction = single undo
    collaborationStore.runInTransaction(() => {
      collaborationStore.removeNode(idNode);
      for (const edgeId of connectedEdgeIds) {
        collaborationStore.removeEdge(edgeId);
      }
    });

    isSubMenuVisible.value = false;
  }

  // ─── UPDATE A NODE: Persist new data, THEN update shared Yjs array ───
  async function updateNode(idModel, idNode) {
    // 1) Grab the current node from Vue Flow
    const node = flowMCD.value.findNode(idNode);
    if (!node) return;
    node.selected = false;

    // 2) Persist to your database
    await $fetch(`/api/models/update`, {
      method: "PUT",
      query: { id: idModel },
      body: {
        node: node,
        type: "node",
        action: "updateNode",
      },
    });

    // 3) Update the node in sharedNodes Yjs array
    collaborationStore.updateNode(idNode, node);
  }

  // Position-only update - not tracked by UndoManager (prevents undo from deleting nodes)
  async function updateNodePosition(idModel, idNode) {
    const node = flowMCD.value.findNode(idNode);
    if (!node) return;

    await $fetch(`/api/models/update`, {
      method: "PUT",
      query: { id: idModel },
      body: {
        node: node,
        type: "node",
        action: "updateNode",
      },
    });

    collaborationStore.updateNodePosition(idNode, node);
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
        properties: [],
      },
    };
  }

  // ─── UPDATE AN EDGE: Persist + update Yjs sharedEdges array ───
  async function updateEdge(idModel, idEdge) {
    const edge = flowMCD.value.findEdge(idEdge);
    edge.selected = false;
    edge.animated = false;

    // 1) Persist to your database
    await $fetch(`/api/models/update`, {
      method: "PUT",
      query: { id: idModel },
      body: {
        edge: edge,
        type: "edge",
        action: "updateEdge",
      },
    });

    // 2) Update in sharedEdges Yjs array
    collaborationStore.updateEdge(idEdge, edge);
  }

  // ─── REMOVE AN EDGE: Delete in DB, THEN remove from sharedEdges array ───
  async function removeEdge(idModel, idEdge) {
    // 1) Delete from your database
    await $fetch(`/api/models/delete`, {
      method: "DELETE",
      query: { idModel: idModel, idEdge: idEdge },
      body: {
        type: "edge",
        action: "removeEdge",
      },
    });

    // 2) Remove from Yjs sharedEdges (single transaction)
    collaborationStore.removeEdge(idEdge);

    isSubMenuVisible.value = false;
  }

  // ─── REMOVE MULTIPLE ELEMENTS (batch for undo grouping) ───
  async function removeElements(idModel, nodeIds, edgeIds) {
    // DB deletes
    for (const nid of nodeIds) {
      $fetch(`/api/models/delete`, {
        method: "DELETE",
        query: { idModel, idNode: nid },
        body: { type: "node", action: "removeNode" },
      }).catch(() => {});
    }
    for (const eid of edgeIds) {
      $fetch(`/api/models/delete`, {
        method: "DELETE",
        query: { idModel, idEdge: eid },
        body: { type: "edge", action: "removeEdge" },
      }).catch(() => {});
    }

    // Yjs: single transaction = single undo
    collaborationStore.runInTransaction(() => {
      for (const nid of nodeIds) collaborationStore.removeNode(nid);
      for (const eid of edgeIds) collaborationStore.removeEdge(eid);
    });

    isSubMenuVisible.value = false;
  }

  // ─── ADD ASSOCIATION FIELD TO A SELECTED EDGE ───
  function addAssociation() {
    const edge = flowMCD.value.findEdge(edgeIdSelected.value);
    // Recompute SVG path center (not strictly needed here, but kept for reference)
    getStraightPath(edge);
    // Locally update the VueFlow edge data
    flowMCD.value.updateEdgeData(edge.id, { hasNodeAssociation: true });

    // Persist that data change into Yjs
    collaborationStore.updateEdge(edge.id, flowMCD.value.findEdge(edge.id));

    isSubMenuVisible.value = true;
    elementsMenu.value = false;
    edgeIdSelected.value = edge.id;
  }

  // ─── ADD NODE + EDGE ON EDGE DROP ───
  async function addNodeAndEdge(idModel, position, sourceNodeId, sourceHandleId) {
    addNewNode.value = true;

    const newNode = createNewNode(position);

    const edgeParams = {
      source: sourceNodeId,
      target: newNode.id,
      sourceHandle: sourceHandleId || null,
      targetHandle: null,
    };
    const newEdge = createNewEdge(edgeParams);

    // Persist node to DB
    await $fetch(`/api/models/update`, {
      method: "PUT",
      query: { id: idModel },
      body: { node: newNode, type: "node" },
    });

    // Persist edge to DB
    await $fetch(`/api/models/update`, {
      method: "PUT",
      query: { id: idModel },
      body: { edge: newEdge, type: "edge", action: "addEdge" },
    });

    // Push both into Yjs in a single transaction (single undo)
    collaborationStore.runInTransaction(() => {
      collaborationStore.addNode(newNode);
      collaborationStore.addEdge(newEdge);
    });

    // Update UI state
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

    // Create the ternary association node
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

    // Create 3 edges from each entity to the central node
    const newEdges = nodes.map((node) => {
      return createNewEdge({
        source: node.id,
        target: ternaryNode.id,
        sourceHandle: 's4',
        targetHandle: 's1',
      });
    });

    // Set default cardinalities
    newEdges.forEach((e) => {
      e.data.sourceCardinality = '0,N';
      e.data.targetCardinality = '0,N';
    });

    // Persist to DB
    await $fetch(`/api/models/update`, {
      method: 'PUT',
      query: { id: idModel },
      body: { node: ternaryNode, type: 'node' },
    });

    for (const edge of newEdges) {
      await $fetch(`/api/models/update`, {
        method: 'PUT',
        query: { id: idModel },
        body: { edge, type: 'edge', action: 'addEdge' },
      });
    }

    // Push into Yjs in a single transaction
    collaborationStore.runInTransaction(() => {
      collaborationStore.addNode(ternaryNode);
      newEdges.forEach((e) => collaborationStore.addEdge(e));
    });

    isSubMenuVisible.value = true;
    nodeIdSelected.value = ternaryNode.id;

    return { node: ternaryNode, edges: newEdges };
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

    getIdNode,
    getIdEdge,
    setFlowInstance,
    createNewNode,
    createNewEdge,

    addNode,
    removeNode,
    updateNode,
    updateNodePosition,
    duplicateNode,
    removeElements,

    updateEdge,
    removeEdge,
    addNodeAndEdge,
    addAssociation,
    addTernaryRelation,
    determineHandles,
  };
});