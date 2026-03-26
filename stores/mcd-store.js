import { computed, ref, nextTick } from "vue";
import { defineStore } from "pinia";
import { getStraightPath, useVueFlow } from "@vue-flow/core";
import { v4 as uuidv4 } from "uuid";
import { useMLDStore } from "./mld-store.js";
import { useCollaborationStore } from "~/stores/collaboration-store.js";
import { resolveCollisions } from "~/utils/useCollisions.js";

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

  function buildVirtualAssociationNodes(nodes, edges) {
    const virtualAssocNodes = [];
    for (const edge of edges) {
      if (!edge.data?.properties?.length && !edge.data?.hasNodeAssociation) continue;
      const srcNode = flowMCD.value.findNode(edge.source);
      const tgtNode = flowMCD.value.findNode(edge.target);
      if (!srcNode || !tgtNode) continue;
      const midX = (srcNode.position.x + tgtNode.position.x) / 2;
      const midY = (srcNode.position.y + tgtNode.position.y) / 2;
      virtualAssocNodes.push({
        id: `_assoc_${edge.id}`,
        position: { x: midX - 80, y: midY - 40 },
        dimensions: { width: 160, height: 80 },
        type: "customEntityAssociation",
        _virtual: true,
      });
    }
    return virtualAssocNodes;
  }

  async function resolveAndSyncCollisions(idModel, movedNodeId = null) {
    if (!flowMCD.value) return [];

    const allNodes = getFlowNodes();
    if (allNodes.length <= 1) return [];

    const movedNode = movedNodeId ? flowMCD.value.findNode(movedNodeId) : null;
    if (movedNode && typeof flowMCD.value.getIntersectingNodes === "function") {
      const intersections = flowMCD.value.getIntersectingNodes(movedNode) || [];
      const hasRealIntersection = intersections.some((n) => n.id !== movedNodeId);
      if (!hasRealIntersection) return [];
    }

    const allEdges = getFlowEdges();
    const virtualAssocNodes = buildVirtualAssociationNodes(allNodes, allEdges);
    const nodesForCollision = [...allNodes, ...virtualAssocNodes];
    const resolved = resolveCollisions(nodesForCollision, { margin: 30 });

    const movedNodes = [];
    for (const rn of resolved) {
      if (rn._virtual) continue;
      const original = allNodes.find((n) => n.id === rn.id);
      if (!original) continue;
      if (rn.position.x === original.position.x && rn.position.y === original.position.y) continue;
      movedNodes.push(rn);
    }

    if (movedNodes.length === 0) return [];

    isResolvingCollisions.value = true;
    try {
      for (const rn of movedNodes) {
        flowMCD.value.updateNode(rn.id, { position: rn.position, selected: false, dragging: false });
      }

      await nextTick();

      const latestNodes = getFlowNodes();
      const freshNodes = latestNodes.map((n) => ({
        ...n,
        position: { ...n.position },
        data: { ...n.data },
        selected: false,
        dragging: false,
      }));
      collaborationStore.setNodes(freshNodes);

      for (const rn of movedNodes) {
        const persistedNode = flowMCD.value.findNode(rn.id);
        if (!persistedNode) continue;
        persistedNode.selected = false;
        persistedNode.dragging = false;
        $fetch(`/api/models/update`, {
          method: "PUT",
          query: { id: idModel },
          body: { node: persistedNode, type: "node", action: "updateNode" },
        });
      }
    } finally {
      isResolvingCollisions.value = false;
    }

    return movedNodes;
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

    // 2b) Resolve collisions — include association entities rendered on edges
    if (flowMCD.value) {
      // Wait for Vue Flow to fully register the new node in the DOM
      await nextTick();
      await nextTick();
      await nextTick();
      await resolveAndSyncCollisions(idModel, newNode.id);
    }

    // 3) Update UI state
    isSubMenuVisible.value = true;
    elementsMenu.value = false;
    nodeIdSelected.value = newNode.id;
    addNewNode.value = false;
  }

  // ─── REMOVE A NODE: Delete from backend, THEN delete from shared Yjs array ───
  async function removeNode(idModel, idNode) {
    // 1) Delete from your database
    await $fetch(`/api/models/delete`, {
      method: "DELETE",
      query: { idModel: idModel, idNode: idNode },
      body: {
        type: "node",
        action: "removeNode",
      },
    });

    // 2) Remove from sharedNodes Yjs array; observer will update VueFlow
    collaborationStore.removeNode(idNode);

    isSubMenuVisible.value = false;
  }

  // ─── UPDATE A NODE: Persist new data, THEN update shared Yjs array ───
  async function updateNode(idModel, idNode) {
    // 1) Grab the current node from Vue Flow
    const node = flowMCD.value.findNode(idNode);
    if (!node) return;
    node.selected = false;

    const movedNodes = await resolveAndSyncCollisions(idModel, idNode);
    if (movedNodes.length > 0) return;

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

    // 2) Remove from Yjs sharedEdges
    collaborationStore.removeEdge(idEdge);

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

    getIdNode,
    getIdEdge,
    setFlowInstance,
    createNewNode,
    createNewEdge,

    addNode,
    removeNode,
    updateNode,
    duplicateNode,

    updateEdge,
    removeEdge,
    addAssociation,
    determineHandles,
    resolveAndSyncCollisions,
  };
});