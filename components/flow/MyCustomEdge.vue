<template>
  <g>
    <!-- Dessiner l'arête avec BaseEdge -->
    <BaseEdge :id="id" :style="style" :path="path[0]" />

    <!-- Rendu des labels avec EdgeLabelRenderer -->
    <EdgeLabelRenderer v-if="sourceCardinality !== null">
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

    <EdgeLabelRenderer v-if="targetCardinality !== null">
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

    <foreignObject :x="center[0] - 230 /2"
                   :y="center[1] - 100 /2"
                   class="w-60 h-full"
    >
      <div>
        <MyCustomEntityAssociation :data="data" />
      </div>
    </foreignObject>
  </g>
</template>

<script>
import {BaseEdge, EdgeLabelRenderer, getStraightPath} from "@vue-flow/core";
import MyCustomEntityAssociation from "./MyCustomEntityAssociation.vue";

export default {
  components: {MyCustomEntityAssociation, BaseEdge, EdgeLabelRenderer },
  props: ["id", "sourceX", "sourceY", "targetX", "targetY", "sourcePosition", "targetPosition", "data"],
  computed: {
    path() {
      return getStraightPath({
        sourceX: this.sourceX,
        sourceY: this.sourceY,
        targetX: this.targetX,
        targetY: this.targetY,
        sourcePosition: this.sourcePosition,
        targetPosition: this.targetPosition,
      });
    },
    style() {
      return {
        strokeWidth: 2,
      };
    },
    sourceCardinality() {
      return this.data?.sourceCardinality || null; // default value or data from edge
    },
    targetCardinality() {
      return this.data?.targetCardinality || null; // default value or data from edge
    },

    center() {
      const { sourceX, sourceY, targetX, targetY } = this;
      return [(sourceX + targetX) / 2, (sourceY + targetY) / 2];
    },
    // Offsets for positioning the labels near the handles

    sourceLabelX() {
      const offset = 30; // Adjust this value to move the label further from the handle
      switch (this.sourcePosition) {
        case 'left':
          return this.sourceX - offset;
        case 'right':
          return this.sourceX + offset;
        case 'top':
          return this.sourceX;
        case 'bottom':
          return this.sourceX;
        default:
          return this.sourceX;
      }
    },
    sourceLabelY() {
      const offset = 30; // Adjust this value to move the label further from the handle
      switch (this.sourcePosition) {
        case 'left':
          return this.sourceY;
        case 'right':
          return this.sourceY;
        case 'top':
          return this.sourceY - offset;
        case 'bottom':
          return this.sourceY + offset;
        default:
          return this.sourceY;
      }
    },
    targetLabelX() {
      const offset = 30; // Adjust this value to move the label further from the handle
      switch (this.targetPosition) {
        case 'left':
          return this.targetX - offset;
        case 'right':
          return this.targetX + offset;
        case 'top':
          return this.targetX;
        case 'bottom':
          return this.targetX;
        default:
          return this.targetX;
      }
    },
    targetLabelY() {
      const offset = 30; // Adjust this value to move the label further from the handle
      switch (this.targetPosition) {
        case 'left':
          return this.targetY;
        case 'right':
          return this.targetY;
        case 'top':
          return this.targetY - offset;
        case 'bottom':
          return this.targetY + offset;
        default:
          return this.targetY;
      }
    },
  }
};
</script>

<style scoped>
.edge-label {
  font-size: 15px;
  background: #F2F5F7;
  padding: 2px;
}
</style>
