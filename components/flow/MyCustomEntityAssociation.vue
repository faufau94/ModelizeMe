<template>
  <div
    ref="content"
    class="bg-white z-40 relative cursor-pointer transition-all duration-200"
    :class="isSelected
      ? 'ring-2 ring-indigo-400 ring-offset-2 shadow-lg'
      : 'shadow-md hover:shadow-lg border border-gray-200'"
    style="border-radius: 14px; min-width: 160px; max-width: 240px;"
    v-bind="$attrs"
  >
    <!-- Diamond icon + name header -->
    <div class="flex items-center justify-center gap-1.5 px-4 pt-3 pb-2 border-b border-gray-100">
      <!-- Diamond shape (SVG) to signal "association" -->
      <svg width="10" height="10" viewBox="0 0 10 10" class="flex-shrink-0" :class="isSelected ? 'text-indigo-500' : 'text-gray-400'">
        <polygon points="5,0 10,5 5,10 0,5" fill="currentColor"/>
      </svg>
      <h3
        v-if="props.data?.name"
        class="text-xs font-semibold text-center text-gray-700 tracking-wide uppercase truncate"
        :class="isSelected ? 'text-indigo-600' : ''"
      >
        {{ props.data.name }}
      </h3>
      <h3 v-else class="text-xs font-semibold text-center text-gray-400 tracking-wide uppercase italic">
        Association
      </h3>
    </div>

    <!-- Fields -->
    <div v-if="props.data?.properties?.length" class="px-3 py-2 space-y-0.5">
      <div
        v-for="(field, index) in props.data.properties"
        :key="index"
        class="flex items-center justify-between gap-3 py-0.5 px-1 rounded hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-center gap-1 min-w-0">
          <div class="w-3.5 flex-shrink-0" v-if="field?.isPrimaryKey">
            <KeyRound :size="11" class="text-amber-500"/>
          </div>
          <div class="w-3.5 flex-shrink-0" v-else-if="field?.isForeignKey">
            <KeyRound :size="11" class="text-gray-400"/>
          </div>
          <div v-else class="w-3.5 flex-shrink-0"></div>

          <span
            class="text-xs text-gray-700 truncate"
            :class="field?.isPrimaryKey ? 'font-semibold underline decoration-amber-400 decoration-2 underline-offset-2' : 'font-normal'"
          >
            {{ field?.isForeignKey ? '#' : '' }}{{ field?.propertyName }}
          </span>
        </div>

        <span class="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded flex-shrink-0 border border-gray-100">
          {{ field?.typeName }}
        </span>
      </div>

      <!-- Timestamps -->
      <div v-if="props.data?.hasTimestamps" class="flex items-center justify-between gap-3 py-0.5 px-1">
        <span class="text-xs text-gray-300 italic w-3.5 inline-block"></span>
        <span class="text-xs text-gray-300 italic flex-1">created_at</span>
        <span class="text-xs text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">Timestamp</span>
      </div>
      <div v-if="props.data?.hasTimestamps" class="flex items-center justify-between gap-3 py-0.5 px-1">
        <span class="text-xs text-gray-300 italic w-3.5 inline-block"></span>
        <span class="text-xs text-gray-300 italic flex-1">updated_at</span>
        <span class="text-xs text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">Timestamp</span>
      </div>
      <div v-if="props.data?.usesSoftDeletes" class="flex items-center justify-between gap-3 py-0.5 px-1">
        <span class="text-xs text-gray-300 italic w-3.5 inline-block"></span>
        <span class="text-xs text-gray-300 italic flex-1">deleted_at</span>
        <span class="text-xs text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">Timestamp</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="px-3 py-2">
      <p class="text-xs text-gray-300 italic text-center">Aucun champ</p>
    </div>

    <div class="pb-1"></div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useMCDStore } from "~/stores/mcd-store.js";
import { KeyRound } from 'lucide-vue-next';
import { storeToRefs } from "pinia";

const mcdStore = useMCDStore();
const { edgeIdSelected } = storeToRefs(mcdStore);
const content = ref(null);

const props = defineProps({
  id: {
    type: String,
    required: false,
  },
  selected: {
    type: Boolean,
    required: false,
  },
  data: {
    type: Object,
    required: false,
  },
});

const isSelected = computed(() =>
  props.selected || (props.id != null && edgeIdSelected.value === props.id)
);
</script>
