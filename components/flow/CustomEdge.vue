<template>
  <g>
    <!-- Hit area (invisible, wider for easier clicking) -->
    <BaseEdge
      :id="id + '-hit'"
      :path="edgePath[0]"
      :style="{
        strokeWidth: 14,
        stroke: 'transparent',
        cursor: 'pointer',
      }"
    />
    <!-- Visible edge path -->
    <BaseEdge
      :id="id"
      :path="edgePath[0]"
      :style="edgeStyle"
      :marker-end="markerEnd"
    />

    <!-- Source cardinality label -->
    <EdgeLabelRenderer v-if="sourceCardinality">
      <div
        :style="{
          pointerEvents: 'none',
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${sourceLabelX}px, ${sourceLabelY}px)`,
        }"
      >
        <div class="cardinality-label" :class="[cardinalityClass, { 'cardinality-label--selected': props.selected }]">
          {{ sourceCardinality }}
        </div>
      </div>
    </EdgeLabelRenderer>

    <!-- Target cardinality label -->
    <EdgeLabelRenderer v-if="targetCardinality">
      <div
        :style="{
          pointerEvents: 'none',
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${targetLabelX}px, ${targetLabelY}px)`,
        }"
      >
        <div class="cardinality-label" :class="[cardinalityClass, { 'cardinality-label--selected': props.selected }]">
          {{ targetCardinality }}
        </div>
      </div>
    </EdgeLabelRenderer>

    <!-- Association table at edge midpoint (editable view only) -->
    <EdgeLabelRenderer v-if="activeTab === 'default'">
      <div
        :style="{
          pointerEvents: 'all',
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${edgePath[1]}px, ${edgePath[2]}px)`,
        }"
        class="nodrag nopan"
      >
        <div @click="onclick">
          <MyCustomEntityAssociation :data="data" :selected="props.selected" />
        </div>
      </div>
    </EdgeLabelRenderer>
  </g>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import MyCustomEntityAssociation from './MyCustomEntityAssociation.vue';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from "@vue-flow/core";
import { storeToRefs } from "pinia";
import { useMCDStore } from "~/stores/mcd-store.js";
import { getEdgeParams } from '~/utils/useFloatingEdge.js';

const mcdStore = useMCDStore();
const { activeTab, nodeIdSelected, isSubMenuVisible, edgeIdSelected } = storeToRefs(mcdStore);

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
  markerEnd: String,
});

const modelType = computed(() => props.data?.modelType ?? 'default');

const edgeParams = computed(() => getEdgeParams(props.sourceNode, props.targetNode));

// Disable animated dash — we use our own selection color instead
watchEffect(() => {
  const flow = mcdStore.flowMCD as any;
  if (props.id && flow) {
    const edge = flow.findEdge(props.id);
    if (edge) edge.animated = false;
  }
});

const edgePath = computed(() => {
  const { sx, sy, tx, ty, sourcePos, targetPos } = edgeParams.value;
  return getSmoothStepPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    borderRadius: 6,
  });
});

/** Edge color per model type */
const edgeColor = computed(() => {
  if (props.selected) return '#6366f1';
  switch (modelType.value) {
    case 'mcd': return '#60a5fa';
    case 'mld': return '#34d399';
    case 'mpd': return '#a78bfa';
    default: return '#94a3b8';
  }
});

const edgeStyle = computed(() => ({
  strokeWidth: props.selected ? 2.5 : 1.8,
  stroke: edgeColor.value,
  transition: 'stroke 0.15s ease, stroke-width 0.15s ease',
}));

/** Cardinality label color per model type */
const cardinalityClass = computed(() => {
  switch (modelType.value) {
    case 'mcd': return 'cardinality-label--mcd';
    case 'mld': return 'cardinality-label--mld';
    case 'mpd': return 'cardinality-label--mpd';
    default: return '';
  }
});

const onclick = () => {
  nodeIdSelected.value = null;
  isSubMenuVisible.value = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (edgeIdSelected as any).value = props.id ?? null;

  const flow = mcdStore.flowMCD as any;
  if (props.id && flow) {
    const edge = flow.findEdge(props.id);
    if (edge) edge.selected = true;
  }
};

const sourceCardinality = computed<string | null>(() => props.data?.sourceCardinality ?? null);
const targetCardinality = computed<string | null>(() => props.data?.targetCardinality ?? null);

const offset = 32;

const sourceLabelX = computed(() => {
  const { sx, sourcePos } = edgeParams.value;
  if (sourcePos === 'left') return sx - offset;
  if (sourcePos === 'right') return sx + offset;
  return sx;
});

const sourceLabelY = computed(() => {
  const { sy, sourcePos } = edgeParams.value;
  if (sourcePos === 'top') return sy - offset;
  if (sourcePos === 'bottom') return sy + offset;
  return sy;
});

const targetLabelX = computed(() => {
  const { tx, targetPos } = edgeParams.value;
  if (targetPos === 'left') return tx - offset;
  if (targetPos === 'right') return tx + offset;
  return tx;
});

const targetLabelY = computed(() => {
  const { ty, targetPos } = edgeParams.value;
  if (targetPos === 'top') return ty - offset;
  if (targetPos === 'bottom') return ty + offset;
  return ty;
});
</script>

<style scoped>
.cardinality-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1.4;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.cardinality-label--selected {
  color: #6366f1;
  border-color: #a5b4fc;
  background: #eef2ff;
}

.cardinality-label--mcd {
  color: #2563eb;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.cardinality-label--mld {
  color: #059669;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.cardinality-label--mpd {
  color: #7c3aed;
  background: #f5f3ff;
  border-color: #c4b5fd;
}
</style>
