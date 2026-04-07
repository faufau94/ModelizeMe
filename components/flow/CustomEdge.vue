<template>
  <g>
    <!-- Hit area (invisible, wider for easier clicking) -->
    <BaseEdge
      :id="id + '-hit'"
      :path="edgePath[0]"
      :style="{
        strokeWidth: 14,
        stroke: 'transparent',
        fill: 'none',
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
          zIndex: 1,
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
          zIndex: 1,
          transform: `translate(-50%, -50%) translate(${targetLabelX}px, ${targetLabelY}px)`,
        }"
      >
        <div class="cardinality-label" :class="[cardinalityClass, { 'cardinality-label--selected': props.selected }]">
          {{ targetCardinality }}
        </div>
      </div>
    </EdgeLabelRenderer>

    <!-- Association table at edge midpoint (editable view only, not for ternary edges) -->
    <EdgeLabelRenderer v-if="activeTab === 'default' && !isTernaryEdge">
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

    <!-- CIF badge on ternary edges -->
    <EdgeLabelRenderer v-if="isTernaryEdge && props.data?.isCIF">
      <div
        :style="{
          pointerEvents: 'none',
          position: 'absolute',
          zIndex: 1,
          transform: `translate(-50%, -50%) translate(${edgePath[1]}px, ${edgePath[2]}px)`,
        }"
      >
        <div class="cif-badge">CIF</div>
      </div>
    </EdgeLabelRenderer>
  </g>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import MyCustomEntityAssociation from './MyCustomEntityAssociation.vue';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, getSimpleBezierPath, getStraightPath, getSmoothStepPath } from "@vue-flow/core";
import { storeToRefs } from "pinia";
import { useMCDStore } from "~/stores/mcd-store.js";
import { getEdgeParams, getDistributedEdgeParams } from '~/utils/useFloatingEdge.js';

const mcdStore = useMCDStore();
const { activeTab, nodeIdSelected, isSubMenuVisible, edgeIdSelected, edgePathStyle } = storeToRefs(mcdStore);

const pathFunctions: Record<string, typeof getBezierPath> = {
  bezier: getBezierPath,
  simpleBezier: getSimpleBezierPath,
  straight: getStraightPath,
  smoothstep: (params) => getSmoothStepPath(params),
  smoothstepSharp: (params) => getSmoothStepPath({ ...params, borderRadius: 0 }),
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

// Ternary edges connect to a ternaryEntity node — they should not display an association table
const isTernaryEdge = computed(() => {
  return props.sourceNode?.type === 'ternaryEntity' || props.targetNode?.type === 'ternaryEntity';
});

const isLoopback = computed(() => props.sourceNode?.id === props.targetNode?.id);

const edgeParams = computed(() => {
  if (isLoopback.value) return null;
  const flow = mcdStore.flowMCD as any;
  if (!flow) return getEdgeParams(props.sourceNode, props.targetNode);
  const allEdges = flow.getEdges?.value ?? flow.getEdges ?? [];
  const allNodes = flow.getNodes?.value ?? flow.getNodes ?? [];
  if (!allEdges.length || !allNodes.length) {
    return getEdgeParams(props.sourceNode, props.targetNode);
  }
  return getDistributedEdgeParams(props.sourceNode, props.targetNode, allEdges, allNodes, props.id);
});

// Disable animated dash - we use our own selection color instead
watchEffect(() => {
  const flow = mcdStore.flowMCD as any;
  if (props.id && flow) {
    const edge = flow.findEdge(props.id);
    if (edge) edge.animated = false;
  }
});

// Loopback arc path: a clean D-shaped arc on the assigned side of the node.
// Supports 4 sides: right (default), bottom, left, top.
const loopbackData = computed(() => {
  if (!isLoopback.value) return null;
  const node = props.sourceNode;
  const pos = node.computedPosition || node.position;
  const w = node.dimensions?.width ?? 320;
  const h = node.dimensions?.height ?? 100;
  const side = props.data?.loopbackSide || 'right';

  let sx: number, sy: number, tx: number, ty: number;
  let cp1x: number, cp1y: number, cp2x: number, cp2y: number;
  let bulge: number;

  // Gap between arc start/end and the node edge for readability
  const gap = 15;

  switch (side) {
    case 'right': {
      bulge = Math.max(100, w * 0.5);
      sx = pos.x + w + gap; sy = pos.y + h * 0.25;
      tx = pos.x + w + gap; ty = pos.y + h * 0.75;
      cp1x = sx + bulge; cp1y = sy - bulge * 0.3;
      cp2x = tx + bulge; cp2y = ty + bulge * 0.3;
      break;
    }
    case 'left': {
      bulge = Math.max(100, w * 0.5);
      sx = pos.x - gap; sy = pos.y + h * 0.25;
      tx = pos.x - gap; ty = pos.y + h * 0.75;
      cp1x = sx - bulge; cp1y = sy - bulge * 0.3;
      cp2x = tx - bulge; cp2y = ty + bulge * 0.3;
      break;
    }
    case 'top': {
      bulge = Math.max(100, h * 0.7);
      sx = pos.x + w * 0.25; sy = pos.y - gap;
      tx = pos.x + w * 0.75; ty = pos.y - gap;
      cp1x = sx - bulge * 0.3; cp1y = sy - bulge;
      cp2x = tx + bulge * 0.3; cp2y = ty - bulge;
      break;
    }
    case 'bottom': {
      bulge = Math.max(100, h * 0.7);
      sx = pos.x + w * 0.25; sy = pos.y + h + gap;
      tx = pos.x + w * 0.75; ty = pos.y + h + gap;
      cp1x = sx - bulge * 0.3; cp1y = sy + bulge;
      cp2x = tx + bulge * 0.3; cp2y = ty + bulge;
      break;
    }
    default: {
      bulge = Math.max(100, w * 0.5);
      sx = pos.x + w + gap; sy = pos.y + h * 0.25;
      tx = pos.x + w + gap; ty = pos.y + h * 0.75;
      cp1x = sx + bulge; cp1y = sy - bulge * 0.3;
      cp2x = tx + bulge; cp2y = ty + bulge * 0.3;
    }
  }

  const path = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;

  // Label at the apex of the arc
  const midX = (sx + cp1x + cp2x + tx) / 4;
  const midY = (sy + cp1y + cp2y + ty) / 4;

  return { path, midX, midY, sx, sy, tx, ty, side };
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
  fill: 'none',
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

const offset = 40;

const sourceLabelX = computed(() => {
  if (isLoopback.value && loopbackData.value) {
    const d = loopbackData.value;
    if (d.side === 'left') return d.sx - offset;
    if (d.side === 'top' || d.side === 'bottom') return d.sx;
    return d.sx + offset;
  }
  const { sx, sourcePos } = edgeParams.value;
  if (sourcePos === 'left') return sx - offset;
  if (sourcePos === 'right') return sx + offset;
  return sx;
});

const sourceLabelY = computed(() => {
  if (isLoopback.value && loopbackData.value) {
    const d = loopbackData.value;
    if (d.side === 'top') return d.sy - offset;
    if (d.side === 'bottom') return d.sy + offset;
    return d.sy;
  }
  const { sy, sourcePos } = edgeParams.value;
  if (sourcePos === 'top') return sy - offset;
  if (sourcePos === 'bottom') return sy + offset;
  return sy;
});

const targetLabelX = computed(() => {
  if (isLoopback.value && loopbackData.value) {
    const d = loopbackData.value;
    if (d.side === 'left') return d.tx - offset;
    if (d.side === 'top' || d.side === 'bottom') return d.tx;
    return d.tx + offset;
  }
  const { tx, targetPos } = edgeParams.value;
  if (targetPos === 'left') return tx - offset;
  if (targetPos === 'right') return tx + offset;
  return tx;
});

const targetLabelY = computed(() => {
  if (isLoopback.value && loopbackData.value) {
    const d = loopbackData.value;
    if (d.side === 'top') return d.ty - offset;
    if (d.side === 'bottom') return d.ty + offset;
    return d.ty;
  }
  const { ty, targetPos } = edgeParams.value;
  if (targetPos === 'top') return ty - offset;
  if (targetPos === 'bottom') return ty + offset;
  return ty;
});
</script>

<style scoped>
.cardinality-label {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  background: hsl(var(--card));
  border: 1.5px solid hsl(var(--border));
  padding: 2px 8px;
  border-radius: 5px;
  line-height: 1.4;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

:root.dark .cardinality-label {
  color: #94a3b8;
}

.cardinality-label--selected {
  color: #6366f1;
  border-color: #a5b4fc;
  background: #eef2ff;
}

:root.dark .cardinality-label--selected {
  background: rgba(99, 102, 241, 0.15);
}

.cardinality-label--mcd {
  color: #2563eb;
  background: #eff6ff;
  border-color: #bfdbfe;
}

:root.dark .cardinality-label--mcd {
  background: rgba(37, 99, 235, 0.15);
  color: #60a5fa;
}

.cardinality-label--mld {
  color: #059669;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

:root.dark .cardinality-label--mld {
  background: rgba(5, 150, 105, 0.15);
  color: #34d399;
}

.cardinality-label--mpd {
  color: #7c3aed;
  background: #f5f3ff;
  border-color: #c4b5fd;
}

:root.dark .cardinality-label--mpd {
  background: rgba(124, 58, 237, 0.15);
  color: #a78bfa;
}

.cif-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #b45309;
  background: #fffbeb;
  border: 1.5px solid #fbbf24;
  padding: 1px 6px;
  border-radius: 4px;
  line-height: 1.4;
  text-transform: uppercase;
}

:root.dark .cif-badge {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}
</style>
