<template>
  <VueFlow
      id="flow-mcd"
      class="ok"
      :edgeTypes="edgeTypes"
      :nodeTypes="nodeTypes"
      :edges="mcdStore?.flowMCD?.edges"
      :nodes="mcdStore?.flowMCD?.nodes"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
  >
    <MiniMap/>
    <Controls/>
    <DropzoneBackground
        :style="{
          backgroundColor: isDragOver ? '#e0eefa' : 'transparent',
          transition: 'background-color 0.2s ease',
        }"
    >
    </DropzoneBackground>

    <template #connection-line="{ sourceX, sourceY, targetX, targetY }">
      <CustomEdge :source-x="sourceX" :source-y="sourceY" :target-x="targetX" :target-y="targetY"/>
    </template>
  </VueFlow>


</template>

<script setup>
import {markRaw, onMounted} from "vue";
import CustomEdge from "./MyCustomEdge.vue";
import {VueFlow} from "@vue-flow/core";
import DropzoneBackground from "~/components/flow/DropzoneBackground.vue";
import {MiniMap} from "@vue-flow/minimap";
import {Controls} from "@vue-flow/controls";
import CustomEntity from "~/components/flow/MyCustomEntity.vue";
import CustomEntityAssociation from "~/components/flow/MyCustomEntityAssociation.vue";
import {useMCDStore} from "~/stores/mcd-store.js";
import useDragAndDrop from "~/utils/useDnd.js";
import {storeToRefs} from "pinia";


const mcdStore = useMCDStore()

const {isSubMenuVisible, nodeIdSelected, edgeIdSelected, elementsMenu} = storeToRefs(mcdStore)

const {onDragOver, onDragLeave, isDragOver, onDrop} = useDragAndDrop()

const nodeTypes = {
  customEntity: markRaw(CustomEntity),
  customEntityAssociation: markRaw(CustomEntityAssociation),
}

const edgeTypes = {
  customEdge: markRaw(CustomEdge),
};


onMounted(() => {
  mcdStore.flowMCD.onConnect((params) => {

    let newEdgeId = mcdStore.getIdEdge();
    let newEdge = {
      id: newEdgeId,
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      type: 'customEdge',
      updatable: true,
      selectable: true,
      style: null,
      label: '',
      data: {
        name: '',
        sourceCardinality: '',
        targetCardinality: '',
        properties: []
      }
    }

    mcdStore.flowMCD.addEdges([newEdge])

    isSubMenuVisible.value = true
    elementsMenu.value = false
    edgeIdSelected.value = newEdgeId
    nodeIdSelected.value = null

  })

  mcdStore.flowMCD.onNodeClick((e) => {
    edgeIdSelected.value = null
    isSubMenuVisible.value = true
    nodeIdSelected.value = e.node.id
  })

  mcdStore.flowMCD.onEdgeClick((e) => {
    nodeIdSelected.value = null
    isSubMenuVisible.value = true
    edgeIdSelected.value = e.edge.id
  })
})


</script>
