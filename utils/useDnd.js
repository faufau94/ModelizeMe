import {ref, watch} from 'vue'

import {storeToRefs} from "pinia";
import {useMCDStore} from "~/stores/mcd-store.js";

/**
 * In a real world scenario you'd want to avoid creating refs in a global scope like this as they might not be cleaned up properly.
 * @type {{draggedType: Ref<string|null>, isDragOver: Ref<boolean>, isDragging: Ref<boolean>}}
 */
const state = {
    /**
     * The type of the node being dragged.
     */
    draggedType: ref(null),
    isDragOver: ref(false),
    isDragging: ref(false),
}

export default function useDragAndDrop() {
    const { draggedType, isDragOver, isDragging } = state

    const mcdStore = useMCDStore(); // Utiliser le store importé
    const { isSubMenuVisible, elementsMenu, nodeIdSelected } = storeToRefs(mcdStore);
    const { getIdNode } = useMCDStore()


    watch(isDragging, (dragging) => {
        document.body.style.userSelect = dragging ? 'none' : ''
    })

    function onDragStart(event, type) {
        if (event.dataTransfer) {
            event.dataTransfer.setData('application/vueflow', type)
            event.dataTransfer.effectAllowed = 'move'
        }

        draggedType.value = type
        isDragging.value = true

        document.addEventListener('drop', onDragEnd)
    }

    /**
     * Handles the drag over event.
     *
     * @param {DragEvent} event
     */
    function onDragOver(event) {
        event.preventDefault()

        if (draggedType.value) {
            isDragOver.value = true

            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'move'
            }
        }
    }

    function onDragLeave() {
        isDragOver.value = false
    }

    function onDragEnd() {
        isDragging.value = false
        isDragOver.value = false
        draggedType.value = null
        isSubMenuVisible.value = true
        elementsMenu.value = false
        document.removeEventListener('drop', onDragEnd)
    }

    /**
     * Handles the drop event.
     *
     * @param {DragEvent} event
     */
    function onDrop(event) {
        const position = mcdStore.flowMCD.screenToFlowCoordinate({
            x: event.clientX,
            y: event.clientY,
        })

        const nodeId = getIdNode()

        const newNode = {
            id: nodeId,
            type: 'customEntity',
            position,
            draggable: true,
            data: {
                name: '',
                properties: [
                    {
                        propertyName: "id",
                        typeName: "Big Increment",
                    },
                ]
            }
        }

        /**
         * Align node position after drop, so it's centered to the mouse
         *
         * We can hook into events even in a callback, and we can remove the event listener after it's been called.
         */
        const { off } = mcdStore.flowMCD.onNodesInitialized(() => {
            mcdStore.flowMCD.updateNode(nodeId, (node) => ({
                position: { x: node.position.x - node.dimensions.width / 2, y: node.position.y - node.dimensions.height / 2 },
            }))

            off()
        })

        mcdStore.flowMCD.addNodes(newNode)

        nodeIdSelected.value = newNode.id
    }

    return {
        draggedType,
        isDragOver,
        isDragging,
        onDragStart,
        onDragLeave,
        onDragOver,
        onDrop,
    }
}
