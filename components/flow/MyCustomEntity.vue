<template>

  <ContextMenu>
    <ContextMenuTrigger :disabled="isReadOnly">
    <div class="bg-white shadow-lg rounded-xl w-80 z-40 relative cursor-pointer transition-all duration-200 hover:shadow-xl"
        :class="[
          isSelected ? 'ring-2 ring-indigo-400 ring-offset-2' : 'border border-gray-200',
          headerColorClass
        ]"
        v-bind="$attrs"
        @mouseover="showHandles"
        @mousedown="showHandles"
        @mouseout="isSelected ? showHandles : hideHandles()">

      <!-- Entity header -->
      <div class="flex justify-center items-center border-b border-gray-100 rounded-t-xl py-3 px-4 md:px-5"
           :class="headerBgClass">
        <h3 v-if="props?.data?.name !== ''" class="text-sm font-semibold text-center text-gray-800 tracking-wide uppercase">
          {{ props?.data?.name ?? 'Sans nom' }}
        </h3>
        <h3 v-else class="text-sm font-semibold text-center text-gray-400 tracking-wide uppercase italic">Sans nom</h3>
      </div>

      <!-- Entity fields -->
      <div class="px-4 py-3 space-y-0.5">
        <div class="flex justify-between items-center gap-4 py-1 rounded-md px-1 hover:bg-gray-50 transition-colors"
             v-for="(field,index) in props?.data?.properties"
             :key="index">
          <div class="flex items-center gap-1 min-w-0">
            <div class="w-4 flex-shrink-0" v-if="field?.isPrimaryKey">
              <KeyRound :size="12" class="text-amber-500"/>
            </div>
            <div class="w-4 flex-shrink-0" v-else-if="field?.isForeignKey">
              <KeyRound :size="12" class="text-gray-400"/>
            </div>
            <div v-else class="w-4 flex-shrink-0"></div>

            <span :class="{ 'underline decoration-amber-400 decoration-2 underline-offset-2' : field?.isPrimaryKey }"
                  class="truncate text-sm font-medium text-gray-700">
              {{ field?.isForeignKey ? '#' : '' }}{{ field?.propertyName }}
            </span>
          </div>

          <div class="flex items-center gap-1 flex-shrink-0">
            <!-- Type badge: hidden in MCD, shown in default/MLD/MPD -->
            <span v-if="modelType !== 'mcd' && field?.typeName" class="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {{ field?.typeName }}
            </span>

            <!-- MPD: show NOT NULL / NULL badge -->
            <span v-if="modelType === 'mpd'" class="text-[10px] px-1 py-0.5 rounded font-mono"
                  :class="field?.isNullable ? 'text-gray-400 bg-gray-50' : 'text-orange-600 bg-orange-50'">
              {{ field?.isNullable ? 'NULL' : 'NOT NULL' }}
            </span>

            <!-- MPD: show AUTO_INCREMENT -->
            <span v-if="modelType === 'mpd' && field?.autoIncrement" class="text-[10px] text-blue-500 bg-blue-50 px-1 py-0.5 rounded font-mono">
              AI
            </span>

            <!-- Nullable toggle: only in editable (default) mode -->
            <template v-if="!isReadOnly">
              <div class="w-4" v-if="field?.propertyName !== 'id'">
                <NullableIcon class="w-4 h-4 cursor-pointer transition-colors"
                              @click="field.isNullable = !field.isNullable"
                              :class="[field?.isNullable ?
                                        'text-gray-700' :
                                        'text-gray-300']"
                />
              </div>
              <div v-else class="w-4"></div>
            </template>
          </div>
        </div>

        <!-- Timestamp fields (dimmed) — only in default and MLD views -->
        <template v-if="props?.data?.hasTimestamps">
          <div class="flex justify-between items-center gap-4 py-1 px-1">
            <div class="flex items-center gap-1">
              <div class="w-4"></div>
              <span class="text-xs text-gray-400 italic">created_at</span>
            </div>
            <div class="flex items-center gap-1">
              <span v-if="modelType !== 'mcd'" class="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">Timestamp</span>
              <NullableIcon v-if="!isReadOnly" class="w-4 h-4 text-gray-400"/>
            </div>
          </div>

          <div class="flex justify-between items-center gap-4 py-1 px-1">
            <div class="flex items-center gap-1">
              <div class="w-4"></div>
              <span class="text-xs text-gray-400 italic">updated_at</span>
            </div>
            <div class="flex items-center gap-1">
              <span v-if="modelType !== 'mcd'" class="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">Timestamp</span>
              <NullableIcon v-if="!isReadOnly" class="w-4 h-4 text-gray-400"/>
            </div>
          </div>
        </template>

        <div v-if="props?.data?.usesSoftDeletes" class="flex justify-between items-center gap-4 py-1 px-1">
          <div class="flex items-center gap-1">
            <div class="w-4"></div>
            <span class="text-xs text-gray-400 italic">deleted_at</span>
          </div>
          <div class="flex items-center gap-1">
            <span v-if="modelType !== 'mcd'" class="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">Timestamp</span>
            <NullableIcon v-if="!isReadOnly" class="w-4 h-4 text-gray-400"/>
          </div>
        </div>

      </div>

      <div>
        <Handle id="s1" type="source" :position="Position.Left" :style="isReadOnly ? hiddenHandleStyle : sourceHandleStyle"/>
        <Handle id="s2" type="source" :position="Position.Top" :style="isReadOnly ? hiddenHandleStyle : sourceHandleStyle"/>
        <Handle id="s3" type="source" :position="Position.Bottom" :style="isReadOnly ? hiddenHandleStyle : sourceHandleStyle"/>
        <Handle id="s4" type="source" :position="Position.Right" :style="isReadOnly ? hiddenHandleStyle : sourceHandleStyle"/>
      </div>
    </div>
    </ContextMenuTrigger>
    <ContextMenuContent v-if="!isReadOnly">
        <ContextMenuItem @click="duplicateNode(props)" class="cursor-pointer">Dupliquer</ContextMenuItem>
        <ContextMenuItem class="cursor-pointer" as-child @click="setNodeTimestamps(!getNodeTimestamps)">
          <div v-if="getNodeTimestamps">
            Désactiver l'horodatage
          </div>
          <div v-else>
            Activer l'horodatage
          </div>
        </ContextMenuItem>
        <ContextMenuItem class="cursor-pointer" as-child @click="setNodeSoftDeletes(!getNodeSoftDeletes)">
          <div v-if="getNodeSoftDeletes">
            Désactiver le soft-deletes
          </div>
          <div v-else>
            Activer le soft-deletes
          </div>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem @click="removeNode(route.params.idModel, props.id)" class="text-red-500 cursor-pointer">Supprimer</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>

<script lang="ts" setup>
import {Handle, Position} from '@vue-flow/core'
import {computed, ref, watch} from 'vue'
import {useMCDStore} from "~/stores/mcd-store.js";
import {storeToRefs} from "pinia";
import {KeyRound} from "lucide-vue-next";
import NullableIcon from '@/components/icon/nullable-icon';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  selected: {
    type: Boolean,
    required: false,
  },
  position: {
    type: Object,
    required: false,
  },
  data: {
    type: Object,
    required: false,
  },
})


const mcdStore = useMCDStore()
const {removeNode, duplicateNode} = mcdStore
const {activeTab, nodeIdSelected, isSaving} = storeToRefs(mcdStore)

const route = useRoute()
const isNodeShown = ref(false)
const isNodeHovered = ref(false)

/** Model type from the node data (set by generators). Defaults to editable mode. */
const modelType = computed(() => props.data?.modelType ?? 'default')
const isReadOnly = computed(() => modelType.value !== 'default')
const isSelected = computed(() => props.selected || nodeIdSelected.value === props.id)

/** Header background color per model type */
const headerBgClass = computed(() => {
  switch (modelType.value) {
    case 'mcd': return 'bg-blue-50/60';
    case 'mld': return 'bg-emerald-50/60';
    case 'mpd': return 'bg-purple-50/60';
    default: return 'bg-gray-50/50';
  }
})

const headerColorClass = computed(() => {
  if (!isReadOnly.value) return '';
  switch (modelType.value) {
    case 'mcd': return 'border-blue-200';
    case 'mld': return 'border-emerald-200';
    case 'mpd': return 'border-purple-200';
    default: return '';
  }
})

const badgeColorClass = computed(() => {
  switch (modelType.value) {
    case 'mcd': return 'text-blue-400';
    case 'mld': return 'text-emerald-400';
    case 'mpd': return 'text-purple-400';
    default: return 'text-gray-400';
  }
})

watch(() => nodeIdSelected.value === props.id, (newVal) => {
  if (isReadOnly.value) return;
  if (newVal) {
    showHandles();
  } else {
    hideHandles();
  }
});

const getNodeTimestamps = computed(() => {
  return props?.data?.hasTimestamps
})

const getNodeSoftDeletes = computed(() => {
  return props?.data?.usesSoftDeletes
})

const setNodeTimestamps = async value => {
  let nodeData = mcdStore?.flowMCD?.findNode(props.id);
  if (nodeData) {
    nodeData.data.hasTimestamps = value
    await updateNode()
  }
}
const setNodeSoftDeletes = async value => {
  let nodeData = mcdStore?.flowMCD?.findNode(props.id);
  if (nodeData) {
    nodeData.data.usesSoftDeletes = value
    await updateNode()
  }
}

const updateNode = async () => {
  isSaving.value = true;
  await mcdStore.updateNode(route.params.idModel, props?.id)

  mcdStore?.flowMCD.updateNodeData(props?.id, (node) => {
    let data = props?.data
    node.data = {
      ...node.data,
      data
    }
  });
  isSaving.value = false;
};

const sourceHandle = ref(0)


const sourceHandleStyle = computed(() => {
  return {
    backgroundColor: '#6366f1',
    padding: '6px',
    opacity: sourceHandle.value,
    border: '2px solid white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
  }
})

const hiddenHandleStyle = {
  opacity: 0,
  pointerEvents: 'none',
  width: '1px',
  height: '1px',
  padding: 0,
  border: 'none',
  backgroundColor: 'transparent',
}

const showHandles = () => {
  if (isReadOnly.value) return
  isNodeShown.value = true
  isNodeHovered.value = true
  sourceHandle.value = 1
}

const hideHandles = () => {
  if (isReadOnly.value) return
  setTimeout(() => {
    if (isNodeHovered.value) isNodeShown.value = false
    isNodeHovered.value = false
  }, 3000)

  sourceHandle.value = 0
}


</script>

<style scoped>
.vue-flow__handle {
  width: 8px;
  height: 8px;
}

.vue-flow__handle-top {
  top: -15px;
}

.vue-flow__handle-bottom {
  bottom: -15px;
}

.vue-flow__handle-left {
  left: -15px;
}

.vue-flow__handle-right {
  right: -15px;
}
</style>
