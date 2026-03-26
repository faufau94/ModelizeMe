import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useMCDStore } from '~/stores/mcd-store.js';
import { useCollaborationStore } from '~/stores/collaboration-store';
import { resolveCollisions } from '~/utils/useCollisions.js';

/**
 * Global state for drag‐and‐drop so it persists across component re‐renders.
 */
const state = {
  draggedType: ref(null),   // what type of node is being dragged (e.g. 'input', etc.)
  isDragOver: ref(false),   // whether the cursor is currently over a valid drop target
  isDragging: ref(false),   // whether a drag operation is in progress
};

export default function useDragAndDrop() {
  // 1) grab reactive flags from our global state object
  const { draggedType, isDragOver, isDragging } = state;

  // 2) Pinia stores (singleton instances)
  const mcdStore = useMCDStore();
  const collaborationStore = useCollaborationStore();

  // 3) we extract only the refs we need from mcdStore
  //    - isSubMenuVisible, elementsMenu, nodeIdSelected, addNewNode
  const {
    isSubMenuVisible,
    elementsMenu,
    nodeIdSelected,
    addNewNode,
  } = storeToRefs(mcdStore);

  // 4) mcdStore.createNewNode() factory to generate a fresh node object
  const { createNewNode } = mcdStore;

  // 5) whenever we start dragging, disable text selection in the document
  watch(isDragging, (dragging) => {
    document.body.style.userSelect = dragging ? 'none' : '';
  });

  /**
   * Called when the user starts dragging a draggable item.
   * We set up the DataTransfer so Vue Flow knows what type of node is being dragged.
   */
  function onDragStart(event, type) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/vueflow', type);
      event.dataTransfer.effectAllowed = 'move';
    }
    draggedType.value = type;
    isDragging.value = true;

    // Listen for a drop anywhere on the document so we can detect when drag ends
    document.addEventListener('drop', onDragEnd);
  }

  /**
   * Called when the cursor moves over a valid drop target.
   * We preventDefault() so the browser allows dropping.
   */
  function onDragOver(event) {
    event.preventDefault();
    if (draggedType.value) {
      isDragOver.value = true;
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    }
  }

  function onDragLeave() {
    isDragOver.value = false;
  }

  /**
   * Called once a drop has occurred (or drag is canceled).
   * We reset dragging flags and re‐enable text selection.
   */
  function onDragEnd() {
    isDragging.value = false;
    isDragOver.value = false;
    draggedType.value = null;
    isSubMenuVisible.value = true;
    elementsMenu.value = false;
    document.removeEventListener('drop', onDragEnd);
  }

  /**
   * Handles the actual drop event on the VueFlow container.
   * Steps:
   *   1) Convert screen coords to flow coords,
   *   2) Create a new node object,
   *   3) Persist to your backend,
   *   4) Push into Yjs shared array via collaborationStore,
   *   5) Let Yjs observer update VueFlow state automatically,
   *   6) Select the new node and finish.
   */
  async function onDrop(event, idModel) {
    // a) Show loading UI in the sub‐menu
    addNewNode.value = true;

    // b) Compute the new node's position inside the VueFlow canvas
    const position = mcdStore.flowMCD.screenToFlowCoordinate({
      x: event.clientX,
      y: event.clientY,
    });

    // c) Build a fresh node object
    const newNode = createNewNode(position);

    /**
     * We want to center the node under the cursor once VueFlow actually
     * renders it. So we listen for onNodesInitialized, and then offset
     * by half the node's width/height.
     */
    const { off } = mcdStore.flowMCD.onNodesInitialized(() => {
        // 1) grab the actual VueFlow‐rendered node (with dimensions)
        const vfNode = mcdStore.flowMCD.findNode(newNode.id);
        if (!vfNode) {
          off();
          return;
        }
      
        // 2) compute half‐width/height offset
        const centeredPosition = {
          x: vfNode.position.x - vfNode.dimensions.width / 2,
          y: vfNode.position.y - vfNode.dimensions.height / 2,
        };
        vfNode.position = centeredPosition;

        // 3) resolve collisions with existing nodes
        const allNodes = mcdStore.flowMCD.getNodes.value;
        const resolved = resolveCollisions(allNodes, { margin: 20 });
        const resolvedNode = resolved.find((n) => n.id === newNode.id);
        const finalPos = resolvedNode?.position || centeredPosition;

        // 4) push final position back into Yjs so everyone stays in sync
        collaborationStore.updateNode(newNode.id, { position: finalPos });

        off();
    });
      

    // d) Persist the new node to your own API
    await $fetch(`/api/models/update`, {
      method: 'PUT',
      query: { id: idModel },
      body: {
        node: newNode,
        type: 'node',
        action: 'addNode',
      },
    });

    // e) Push the node into the shared Yjs array.
    //    That triggers the Yjs observer in collaborationStore, which does:
    //       mcdStore.flowMCD.setNodes(collaborationStore.nodes)
    //    → VueFlow renders the new node automatically.
    collaborationStore.addNode(newNode);

    // f) Mark that the new node is selected in the sidebar
    nodeIdSelected.value = newNode.id;
    addNewNode.value = false;
  }

  return {
    draggedType,
    isDragOver,
    isDragging,
    onDragStart,
    onDragLeave,
    onDragOver,
    onDrop,
  };
}