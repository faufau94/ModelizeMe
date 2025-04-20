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
        :cx="(tx !== undefined ? tx : toX)"
        :cy="(ty !== undefined ? ty : toY)"
        fill="#fff"
        r="3"
        stroke="#222"
        :stroke-width="1.5"
      />
    </g>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  import { getSmoothStepPath } from '@vue-flow/vue';
  import { getEdgeParams } from '@/utils/useFloatingEdge.js';
  
  // Props provided by Vue Flow when rendering connection lines
  const props = defineProps({
    fromNode: Object,
    toX: Number,
    toY: Number,
    fromPosition: String,
    toPosition: String,
  });
  
  const { fromNode, toX, toY, fromPosition, toPosition } = props;
  
  // Compute parameters based on source node and a mock target at cursor
  const params = computed(() => {
    if (!fromNode) return null;
    const targetNode = {
      width: 1,
      height: 1,
      positionAbsolute: { x: toX, y: toY },
    };
    return getEdgeParams(fromNode, targetNode);
  });
  
  // Generate the bezier path string
  const edgePath = computed(() => {
    if (!params.value) return '';
    const { sx, sy, tx: px, ty: py, sourcePos, targetPos } = params.value;
    const [path] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sourcePos || fromPosition,
      targetPosition: targetPos || toPosition,
      targetX: px !== undefined ? px : toX,
      targetY: py !== undefined ? py : toY,
    });
    return path;
  });
  
  // Expose tx/ty for the circle fallback
  const tx = computed(() => params.value?.tx);
  const ty = computed(() => params.value?.ty);
  </script>
  
  <style scoped>
  .animated {
    /* optional dash animation */
    stroke-dasharray: 5;
    animation: dash 1s linear infinite;
  }
  
  @keyframes dash {
    to { stroke-dashoffset: -10; }
  }
  </style>