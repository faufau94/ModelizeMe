<template>
  <div class="dndflow">
    <VueFlow
        :id="'flow-mcd-' + route.params.idModel"
        class="ok"
        :edges="edges"
        :nodes="nodes"
        :edgeTypes="edgeTypes"
        :nodeTypes="nodeTypes"
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
  </div>

</template>

<script setup>
import {markRaw, onMounted} from "vue";
import CustomEdge from "~/components/flow/MyCustomEdge.vue";
import {useVueFlow, VueFlow} from "@vue-flow/core";
import DropzoneBackground from "~/components/flow/DropzoneBackground.vue";
import {MiniMap} from "@vue-flow/minimap";
import {Controls} from "@vue-flow/controls";
import CustomEntity from "~/components/flow/MyCustomEntity.vue";
import CustomEntityAssociation from "~/components/flow/MyCustomEntityAssociation.vue";
import {useMCDStore} from "~/stores/mcd-store.js";
import useDragAndDrop from "~/utils/useDnd.js";
import {storeToRefs} from "pinia";

const route = useRoute()

const {
  onInit,
  addNodes,
  addEdges,
  nodes,
  edges,
  onConnect,
  onNodeClick,
  onEdgeClick
} = useVueFlow({id: 'flow-mcd-' + route.params.idModel})

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


onMounted(async () => {

  const res = await $fetch("/api/models/read", {
    method: "GET",
    query: {id: route.params.idModel},
  });

  if (res.nodes.length !== 0) {
    addNodes(res.nodes)
  }

  if (res.edges.length !== 0) {
    addEdges(res.edges)
  }



  onConnect((params) => {

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

    addEdges([newEdge])

    isSubMenuVisible.value = true
    elementsMenu.value = false
    edgeIdSelected.value = newEdgeId
    nodeIdSelected.value = null

  })

  onNodeClick((e) => {
    edgeIdSelected.value = null
    isSubMenuVisible.value = true
    nodeIdSelected.value = e.node.id
  })

  onEdgeClick((e) => {
    nodeIdSelected.value = null
    isSubMenuVisible.value = true
    edgeIdSelected.value = e.edge.id
  })
})


</script>
