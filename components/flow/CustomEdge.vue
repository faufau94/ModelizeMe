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
          <MyCustomEntityAssociation :data="data" :selected="props.selected" :edgeId="props.id" />
        </div>
      </div>
    </EdgeLabelRenderer>
  </g>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import MyCustomEntityAssociation from './MyCustomEntityAssociation.vue';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, getSimpleBezierPath, getStraightPath } from "@vue-flow/core";
import { storeToRefs } from "pinia";
import { useMCDStore } from "~/stores/mcd-store.js";
import { getEdgeParams } from '~/utils/useFloatingEdge.js';

const mcdStore = useMCDStore();
const { activeTab, nodeIdSelected, isSubMenuVisible, edgeIdSelected, edgePathStyle } = storeToRefs(mcdStore);

const pathFunctions: Record<string, typeof getBezierPath> = {
  bezier: getBezierPath,
  simpleBezier: getSimpleBezierPath,
  straight: getStraightPath,
};

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

const isLoopback = computed(() => props.sourceNode?.id === props.targetNode?.id);

const edgeParams = computed(() => {
  if (isLoopback.value) return null;
  return getEdgeParams(props.sourceNode, props.targetNode);
});

// Disable animated dash - we use our own selection color instead
watchEffect(() => {
  const flow = mcdStore.flowMCD as any;
  if (props.id && flow) {
    const edge = flow.findEdge(props.id);
    if (edge) edge.animated = false;
  }
});

// Loopback arc path: loops above the node (Merise-style)
// Uses a cubic bezier that goes up and to the right, placing the association table
// well above and to the right of the node for clear readability.
const loopbackData = computed(() => {
  if (!isLoopback.value) return null;
  const node = props.sourceNode;
  const pos = node.computedPosition || node.position;
  const w = node.dimensions?.width ?? 320;
  const h = node.dimensions?.height ?? 100;

  // Start from right side (top third), end at top side (right third)
  const sx = pos.x + w;
  const sy = pos.y + h * 0.3;
  const tx = pos.x + w * 0.7;
  const ty = pos.y;

  // Control points: swing out far to the upper-right
  const cpOffset = Math.max(120, w * 0.5);
  const cp1x = sx + cpOffset;
  const cp1y = sy - cpOffset;
  const cp2x = tx + cpOffset;
  const cp2y = ty - cpOffset;

  const path = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;

  // Midpoint of the bezier (approximate: average of control points)
  const midX = (sx + cp1x + cp2x + tx) / 4;
  const midY = (sy + cp1y + cp2y + ty) / 4;

  return { path, midX, midY, sx, sy, tx, ty };
});

const edgePath = computed(() => {
  if (isLoopback.value && loopbackData.value) {
    return [loopbackData.value.path, loopbackData.value.midX, loopbackData.value.midY];
  }
  const { sx, sy, tx, ty, sourcePos, targetPos } = edgeParams.value;
  const fn = pathFunctions[edgePathStyle.value] || getBezierPath;
  return fn({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
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
  if (isLoopback.value && loopbackData.value) return loopbackData.value.sx + offset;
  const { sx, sourcePos } = edgeParams.value;
  if (sourcePos === 'left') return sx - offset;
  if (sourcePos === 'right') return sx + offset;
  return sx;
});

const sourceLabelY = computed(() => {
  if (isLoopback.value && loopbackData.value) return loopbackData.value.sy - offset;
  const { sy, sourcePos } = edgeParams.value;
  if (sourcePos === 'top') return sy - offset;
  if (sourcePos === 'bottom') return sy + offset;
  return sy;
});

const targetLabelX = computed(() => {
  if (isLoopback.value && loopbackData.value) return loopbackData.value.tx + offset;
  const { tx, targetPos } = edgeParams.value;
  if (targetPos === 'left') return tx - offset;
  if (targetPos === 'right') return tx + offset;
  return tx;
});

const targetLabelY = computed(() => {
  if (isLoopback.value && loopbackData.value) return loopbackData.value.ty - offset;
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
