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

    <foreignObject :x="center[0] - 230 / 2"
                   :y="center[1] - foreignObjectHeight / 2"
                   width="230"
                   :height="foreignObjectHeight"
                   class="w-60 rounded-[50px]"
    >
      <div v-if="activeTab === 'mcd'">
        <MyCustomEntityAssociation :data="data" />
      </div>
    </foreignObject>
  </g>
</template>

<script setup lang="ts">
import { computed, watchEffect, ref } from 'vue';
import MyCustomEntityAssociation from './MyCustomEntityAssociation.vue';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useNode } from "@vue-flow/core";
import { storeToRefs } from "pinia";
import { useMCDStore } from "~/stores/mcd-store.js";
import { getEdgeParams } from '~/utils/useFloatingEdge.js';

const mcdStore = useMCDStore();
const { activeTab, foreignObjectHeight } = storeToRefs(mcdStore);

// Props
const props = defineProps({
  id: String,
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
});

// Calcul du chemin de l'arête
const edgePath = computed(() => {
  const { sx, sy, tx, ty, sourcePos, targetPos } = edgeParams.value;
  return getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  });
});

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
  switch (props.sourcePosition) {
    case 'left':
      return props.sourceX - offset;
    case 'right':
      return props.sourceX + offset;
    case 'top':
    case 'bottom':
      return props.sourceX;
    default:
      return props.sourceX;
  }
});

const sourceLabelY = computed(() => {
  switch (props.sourcePosition) {
    case 'top':
      return props.sourceY - offset;
    case 'bottom':
      return props.sourceY + offset;
    case 'left':
    case 'right':
      return props.sourceY;
    default:
      return props.sourceY;
  }
});

const targetLabelX = computed(() => {
  switch (props.targetPosition) {
    case 'left':
      return props.targetX - offset;
    case 'right':
      return props.targetX + offset;
    case 'top':
    case 'bottom':
      return props.targetX;
    default:
      return props.targetX;
  }
});

const targetLabelY = computed(() => {
  switch (props.targetPosition) {
    case 'top':
      return props.targetY - offset;
    case 'bottom':
      return props.targetY + offset;
    case 'left':
    case 'right':
      return props.targetY;
    default:
      return props.targetY;
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
