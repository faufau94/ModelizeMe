import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useModelStore } from '~/stores/model-store.js';
import { useCollaborationStore } from '~/stores/collaboration-store';
import { findFreePosition } from '~/utils/useCollisions.js';

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
  const mcdStore = useModelStore();
  const collaborationStore = useCollaborationStore();

  // 3) we extract only the refs we need from mcdStore
  const {
    isSubMenuVisible,
    elementsMenu,
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
   * Converts screen coords → flow coords, creates a node, persists via event sourcing,
   * then adjusts position once VueFlow renders it.
   */
  async function onDrop(event, idModel) {
    // a) Compute the new node's position inside the VueFlow canvas
    const position = mcdStore.flowMCD.screenToFlowCoordinate({
      x: event.clientX,
      y: event.clientY,
    });

    // b) Build a fresh node object
    const newNode = createNewNode(position);

    // c) Persist via event sourcing (handles server + Yjs + undo stack)
    await mcdStore.addNode(idModel, newNode);

    // d) Center the node under cursor once VueFlow knows its dimensions
    const { off } = mcdStore.flowMCD.onNodesInitialized(() => {
        const vfNode = mcdStore.flowMCD.findNode(newNode.id);
        if (!vfNode) { off(); return; }

        // Center under cursor
        const centeredPosition = {
          x: vfNode.position.x - vfNode.dimensions.width / 2,
          y: vfNode.position.y - vfNode.dimensions.height / 2,
        };

        // Find free position that doesn't overlap existing nodes/associations
        const allNodes = mcdStore.flowMCD.getNodes.value || [];
        const otherNodes = allNodes.filter(n => n.id !== newNode.id);
        const freePos = findFreePosition(
          centeredPosition,
          { width: vfNode.dimensions.width, height: vfNode.dimensions.height },
          otherNodes,
          mcdStore.flowMCD
        );
        vfNode.position = freePos;

        // Persist adjusted position (non-undoable, cosmetic adjustment)
        collaborationStore.updateNode(newNode.id, { position: freePos });
        mcdStore.updateNodePosition(idModel, newNode.id, null);
        off();
    });
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