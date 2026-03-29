<template>
  <g v-if="fromNode">
    <path
      :d="edgePath"
      fill="none"
      :stroke="strokeColor"
      :stroke-width="1.5"
      class="animated"
    />
    <circle
      :cx="toX"
      :cy="toY"
      fill="#fff"
      :stroke="strokeColor"
      r="3"
      :stroke-width="1.5"
    />
  </g>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { Position, getBezierPath, getSimpleBezierPath, getStraightPath, connectionExists, useVueFlow } from '@vue-flow/core';
import { useMCDStore } from '~/stores/mcd-store.js';
import { storeToRefs } from 'pinia';

const mcdStore = useMCDStore();
const { edgePathStyle } = storeToRefs(mcdStore);

const pathFunctions = {
  bezier: getBezierPath,
  simpleBezier: getSimpleBezierPath,
  straight: getStraightPath,
};

const props = defineProps({
  fromNode: Object,
  toX: Number,
  toY: Number,
  fromPosition: String,
  toPosition: String,
});

const { getNodes, connectionStartHandle, edges } = useVueFlow();

const closest = reactive({ node: null, handle: null });
const canSnap = ref(false);

const HIGHLIGHT_COLOR = '#6366f1';
const SNAP_COLOR = '#10b981';
const MIN_DISTANCE = 100;
const SNAP_DISTANCE = 50;

// Track closest node/handle as cursor moves
watch([() => props.toX, () => props.toY], (_, __, onCleanup) => {
  if (!connectionStartHandle.value) return;

  const closestResult = getNodes.value.reduce(
    (res, n) => {
      const pos = n.computedPosition || n.position;
      if (!pos || !n.dimensions) return res;
      const dx = props.toX - (pos.x + n.dimensions.width / 2);
      const dy = props.toY - (pos.y + n.dimensions.height / 2);
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < res.distance && d < MIN_DISTANCE) {
        res.distance = d;
        res.node = n;
      }
      return res;
    },
    { distance: Number.MAX_VALUE, node: null },
  );

  if (!closestResult.node) {
    closest.node = null;
    closest.handle = null;
    canSnap.value = false;
    return;
  }

  canSnap.value = closestResult.distance < SNAP_DISTANCE;

  const handleType = connectionStartHandle.value.type === 'source' ? 'target' : 'source';
  // All our handles are "source" type - find any handle on the target node
  const handles = closestResult.node.handleBounds?.[handleType]
    || closestResult.node.handleBounds?.source
    || [];

  const closestHandle = handles.reduce((prev, curr) => {
    if (!prev) return curr;
    const nodePos = closestResult.node.computedPosition || closestResult.node.position;
    const prevDist = Math.sqrt((nodePos.x + prev.x + prev.width / 2 - props.toX) ** 2 + (nodePos.y + prev.y + prev.height / 2 - props.toY) ** 2);
    const currDist = Math.sqrt((nodePos.x + curr.x + curr.width / 2 - props.toX) ** 2 + (nodePos.y + curr.y + curr.height / 2 - props.toY) ** 2);
    return prevDist < currDist ? prev : curr;
  }, null);

  if (!closestHandle) return;

  // Skip if connection already exists
  if (connectionExists(
    {
      source: connectionStartHandle.value.nodeId,
      sourceHandle: connectionStartHandle.value.handleId,
      target: closestResult.node.id,
      targetHandle: closestHandle.id,
    },
    edges.value,
  )) {
    return;
  }

  // Visual feedback on target node
  const el = document.querySelector(`[data-nodeid='${closestResult.node.id}']`);
  if (el) {
    const prevBoxShadow = el.style.boxShadow;
    el.style.boxShadow = canSnap.value
      ? `0 0 0 3px ${SNAP_COLOR}, 0 4px 12px rgba(16, 185, 129, 0.25)`
      : `0 0 0 2px ${HIGHLIGHT_COLOR}, 0 4px 12px rgba(99, 102, 241, 0.2)`;
    closest.node = closestResult.node;
    closest.handle = closestHandle;

    onCleanup(() => {
      el.style.boxShadow = prevBoxShadow;
      closest.node = null;
      closest.handle = null;
      canSnap.value = false;
    });
  }
});

const strokeColor = computed(() => {
  if (canSnap.value) return SNAP_COLOR;
  if (closest.node) return HIGHLIGHT_COLOR;
  return '#94a3b8';
});

const params = computed(() => {
  const node = props.fromNode;
  if (!node) return null;

  const pos = node.computedPosition || node.positionAbsolute || node.position;
  if (!pos) return null;

  const w = node.dimensions?.width ?? 0;
  const h = node.dimensions?.height ?? 0;
  const cx = pos.x + w / 2;
  const cy = pos.y + h / 2;

  const dx = Math.abs(cx - props.toX);
  const dy = Math.abs(cy - props.toY);

  let handlePos;
  if (dx > dy) {
    handlePos = cx > props.toX ? Position.Left : Position.Right;
  } else {
    handlePos = cy > props.toY ? Position.Top : Position.Bottom;
  }

  const handle = node.handleBounds?.source?.find((h) => h.position === handlePos);
  let sx, sy;
  if (handle) {
    let offsetX = handle.width / 2;
    let offsetY = handle.height / 2;
    if (handlePos === Position.Left) offsetX = 0;
    else if (handlePos === Position.Right) offsetX = handle.width;
    else if (handlePos === Position.Top) offsetY = 0;
    else if (handlePos === Position.Bottom) offsetY = handle.height;
    sx = pos.x + handle.x + offsetX;
    sy = pos.y + handle.y + offsetY;
  } else {
    sx = cx;
    sy = cy;
  }

  return { sx, sy, sourcePos: handlePos };
});

const edgePath = computed(() => {
  if (!params.value) return '';
  const { sx, sy, sourcePos } = params.value;
  const fn = pathFunctions[edgePathStyle.value] || getBezierPath;
  const [path] = fn({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: sourcePos,
    targetX: props.toX,
    targetY: props.toY,
  });
  return path;
});
</script>

<style scoped>
.animated {
  stroke-dasharray: 5;
  animation: dash 1s linear infinite;
}

@keyframes dash {
  to { stroke-dashoffset: -10; }
}
</style>
