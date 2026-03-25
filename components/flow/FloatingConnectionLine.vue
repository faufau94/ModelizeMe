<template>
  <g v-if="fromNode">
    <path
      :d="edgePath"
      fill="none"
      stroke="#222"
      :stroke-width="1.5"
      class="animated"
    />
    <circle
      :cx="toX"
      :cy="toY"
      fill="#fff"
      r="3"
      stroke="#222"
      :stroke-width="1.5"
    />
  </g>
</template>

<script setup>
import { computed } from 'vue';
import { Position, getSmoothStepPath } from '@vue-flow/core';

const props = defineProps({
  fromNode: Object,
  toX: Number,
  toY: Number,
  fromPosition: String,
  toPosition: String,
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
  const [path] = getSmoothStepPath({
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
