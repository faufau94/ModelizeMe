<template>
  <g>
    <!-- Dessiner l'arête avec BaseEdge -->
    <BaseEdge :id="id" :style="style" :path="edgePath[0]" />

    <!-- Rendu des labels avec EdgeLabelRenderer -->
    <EdgeLabelRenderer v-if="sourceCardinality !== null || activeTab === 'mcd'">
      <div
          :style="{
          pointerEvents: 'all',
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${sourceLabelX}px, ${sourceLabelY}px)`,
        }"
          class=""
      >
        <div class="edge-label">
          {{ sourceCardinality }}
        </div>
      </div>
    </EdgeLabelRenderer>

    <EdgeLabelRenderer v-if="targetCardinality !== null || activeTab === 'mcd'">
      <div
          :style="{
          pointerEvents: 'all',
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${targetLabelX}px, ${targetLabelY}px)`,
        }"
          class=""
      >
        <div class="edge-label">
          {{ targetCardinality }}
        </div>
      </div>
    </EdgeLabelRenderer>

    <!--
    <foreignObject :x="center[0] - 230 / 2"
                   :y="center[1] - foreignObjectHeight / 2"
                   width="230"
                   :height="foreignObjectHeight"
                   class="w-60 rounded-[50px]"
    >
      <div v-if="activeTab === 'mcd'">
        <MyCustomEntityAssociation :data="data" :selected="selected" />
      </div>
    </foreignObject>
    -->


    <EdgeLabelRenderer>
    <div
        :style="{
        pointerEvents: 'all',
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${edgePath[1]}px,${edgePath[2]}px)`,
      }"
        class="nodrag nopan"
    >
      <div @click="onclick" v-if="activeTab === 'mcd'">
        <MyCustomEntityAssociation :data="data" :selected="selected" />
      </div>
    </div>
    </EdgeLabelRenderer>
  </g>
</template>

<script setup lang="ts">
import { computed, watchEffect, ref, watch} from 'vue';
import MyCustomEntityAssociation from './MyCustomEntityAssociation.vue';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useNode } from "@vue-flow/core";
import { storeToRefs } from "pinia";
import { useMCDStore } from "~/stores/mcd-store.js";
import { getEdgeParams } from '~/utils/useFloatingEdge.js';

const mcdStore = useMCDStore();
const { activeTab, foreignObjectHeight, nodeIdSelected,
  isSubMenuVisible, edgeIdSelected} = storeToRefs(mcdStore);

// Props
const props = defineProps({
  id: String,
  selected: Boolean,
  animated: Boolean,
  sourceX: Number,
  sourceY: Number,
  targetX: Number,
  targetY: Number,
  sourcePosition: String,
  targetPosition: String,
  sourceNode: Object,
  targetNode: Object,
  data: Object,
});

// Références pour les paramètres de l'arête
const edgeParams = ref({
  sx: 0,
  sy: 0,
  tx: 0,
  ty: 0,
  sourcePos: null,
  targetPos: null,
});


// Mise à jour des paramètres de l'arête
watchEffect(() => {
  if (props.sourceNode && props.targetNode) {
    edgeParams.value = getEdgeParams(props.sourceNode, props.targetNode);
  }

  if(props.id) {
    const edge = mcdStore.flowMCD.findEdge(props.id)
    console.log('edge', edge);
    
    edge.animated = props.selected
  }

});


// Calcul du chemin de l'arête
const edgePath = computed(() => {
  const { sx, sy, tx, ty, sourcePos, targetPos } = edgeParams.value;
  return getBezierPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
  });
});

const onclick = () => {
  nodeIdSelected.value = null
  isSubMenuVisible.value = true
  edgeIdSelected.value = props.id

  const edge = mcdStore.flowMCD.findEdge(props.id)
  edge.selected = true
  edge.animated = true
}

const style = computed(() => ({
  strokeWidth: 2,
}));

const sourceCardinality = computed(() => props.data?.sourceCardinality || null);
const targetCardinality = computed(() => props.data?.targetCardinality || null);

const center = computed(() => {
  const { sourceX, sourceY, targetX, targetY } = props;
  return [(sourceX + targetX) / 2, (sourceY + targetY) / 2];
});

// Offsets pour positionner les labels près des poignées
const offset = 30;

const sourceLabelX = computed(() => {
  const { sx, sourcePos } = edgeParams.value;
  switch (sourcePos) {
    case 'left':
      return sx - offset;
    case 'right':
      return sx + offset;
    case 'top':
    case 'bottom':
      return sx;
    default:
      return sx;
  }
});

const sourceLabelY = computed(() => {
  const { sy, sourcePos } = edgeParams.value;
  switch (sourcePos) {
    case 'top':
      return sy - offset;
    case 'bottom':
      return sy + offset;
    case 'left':
    case 'right':
      return sy;
    default:
      return sy;
  }
});

const targetLabelX = computed(() => {
  const { tx, targetPos } = edgeParams.value;
  switch (targetPos) {
    case 'left':
      return tx - offset;
    case 'right':
      return tx + offset;
    case 'top':
    case 'bottom':
      return tx;
    default:
      return tx;
  }
});

const targetLabelY = computed(() => {
  const { ty, targetPos } = edgeParams.value;
  switch (targetPos) {
    case 'top':
      return ty - offset;
    case 'bottom':
      return ty + offset;
    case 'left':
    case 'right':
      return ty;
    default:
      return ty;
  }
});
</script>

<style scoped>
.edge-label {
  font-size: 15px;
  background: #F2F5F7;
  padding: 2px;
}
</style>
