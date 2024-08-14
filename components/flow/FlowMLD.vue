<template>

  <VueFlow
      id="flow-mld"
      :edgeTypes="edgeTypes"
      :nodeTypes="nodeTypes"
      :edges="mldStore?.flowMLD?.edges"
      :nodes="mldStore?.flowMLD?.nodes"
  >
    <MiniMap/>
    <Controls/>

    <template #connection-line="{ sourceX, sourceY, targetX, targetY }">
      <CustomEdge :source-x="sourceX" :source-y="sourceY" :target-x="targetX" :target-y="targetY"/>
    </template>
  </VueFlow>
</template>

<script setup>
import {VueFlow} from "@vue-flow/core";
import CustomEdge from "./MyCustomEdge.vue";
import {MiniMap} from "@vue-flow/minimap";
import {Controls} from "@vue-flow/controls";
import {markRaw} from "vue";
import CustomEntity from "./MyCustomEntity.vue";
import CustomEntityAssociation from "./MyCustomEntityAssociation.vue";
import {useMLDStore} from "~/stores/mld-store.js";


const mldStore = useMLDStore()

const nodeTypes = {
  customEntity: markRaw(CustomEntity),
  customEntityAssociation: markRaw(CustomEntityAssociation),
}

const edgeTypes = {
  customEdge: markRaw(CustomEdge),
};

/*
onMounted(() => {

  const nodes1 = ref([
    { id: '4', label: 'Node 4', position: { x: 250, y: 5 } },
    { id: '5', label: 'Node 5', position: { x: 100, y: 100 } },
    { id: '6', label: 'Node 6', position: { x: 400, y: 100 } },
    { id: '7', label: 'Node 7', position: { x: 450, y: 300 } },
  ])

  const edges1 = ref([
    { id: 'e4-5', source: '4', target: '5' },
    { id: 'e4-6', source: '4', target: '6' },
  ])

  mldStore.flowMLD.addNodes(nodes1.value)
  mldStore.flowMLD.addEdges(edges1.value)
})

 */

</script>