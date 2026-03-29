<template>
  <div
    class="relative cursor-pointer transition-all duration-200"
    :class="isSelected ? 'drop-shadow-lg' : 'drop-shadow-md hover:drop-shadow-lg'"
    @mouseover="showHandles"
    @mousedown="showHandles"
    @mouseout="hideHandles"
    v-bind="$attrs"
  >
    <!-- Diamond shape via rotated square -->
    <div
      class="bg-white border-2 transition-colors duration-200"
      :class="isSelected ? 'border-indigo-400' : 'border-gray-300'"
      :style="{
        width: '120px',
        height: '120px',
        transform: 'rotate(45deg)',
        borderRadius: '8px',
      }"
    >
      <!-- Counter-rotate content so text stays horizontal -->
      <div
        class="flex flex-col items-center justify-center w-full h-full"
        style="transform: rotate(-45deg)"
      >
        <svg width="12" height="12" viewBox="0 0 10 10" class="mb-1" :class="isSelected ? 'text-indigo-500' : 'text-gray-400'">
          <polygon points="5,0 10,5 5,10 0,5" fill="currentColor"/>
        </svg>
        <h3
          v-if="props.data?.name"
          class="text-xs font-semibold text-center text-gray-700 tracking-wide uppercase truncate max-w-[90px]"
          :class="isSelected ? 'text-indigo-600' : ''"
        >
          {{ props.data.name }}
        </h3>
        <h3 v-else class="text-xs font-semibold text-center text-gray-400 tracking-wide uppercase italic">
          Association
        </h3>
        <p v-if="fieldCount > 0" class="text-[10px] text-gray-400 mt-0.5">
          {{ fieldCount }} champ{{ fieldCount > 1 ? 's' : '' }}
        </p>
      </div>
    </div>

    <!-- Handles (positioned relative to diamond tips) -->
    <Handle id="s1" type="source" :position="Position.Left" :style="handleStyle" style="top: 50%"/>
    <Handle id="s2" type="source" :position="Position.Top" :style="handleStyle" style="left: 50%"/>
    <Handle id="s3" type="source" :position="Position.Bottom" :style="handleStyle" style="left: 50%"/>
    <Handle id="s4" type="source" :position="Position.Right" :style="handleStyle" style="top: 50%"/>
  </div>
</template>

<script lang="ts" setup>
import { Handle, Position } from '@vue-flow/core';
import { computed, ref } from 'vue';
import { useMCDStore } from '~/stores/mcd-store.js';
import { storeToRefs } from 'pinia';

const mcdStore = useMCDStore();
const { nodeIdSelected } = storeToRefs(mcdStore);

const props = defineProps({
  id: { type: String, required: true },
  selected: { type: Boolean, required: false },
  data: { type: Object, required: false },
});

const isSelected = computed(() => props.selected || nodeIdSelected.value === props.id);
const fieldCount = computed(() => props.data?.properties?.length ?? 0);

const handleOpacity = ref(0);

const handleStyle = computed(() => ({
  backgroundColor: '#6366f1',
  padding: '6px',
  opacity: handleOpacity.value,
  border: '2px solid white',
  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
  transition: 'opacity 0.2s ease',
}));

const showHandles = () => { handleOpacity.value = 1; };
const hideHandles = () => {
  setTimeout(() => { handleOpacity.value = 0; }, 3000);
};
</script>

<style scoped>
.vue-flow__handle {
  width: 8px;
  height: 8px;
}
</style>
