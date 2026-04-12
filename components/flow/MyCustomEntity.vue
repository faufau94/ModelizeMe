<template>

  <ContextMenu>
    <ContextMenuTrigger :disabled="isReadOnly">
    <div class="bg-white dark:bg-card shadow-lg rounded-xl w-80 relative cursor-pointer transition-all duration-200 hover:shadow-xl"
        :class="[
          isConnectHovered ? 'ring-2 ring-primary ring-offset-2 shadow-primary/30 shadow-xl scale-[1.02]'
            : isConnectTarget ? 'ring-2 ring-primary/60 ring-offset-2 shadow-primary/20 shadow-lg'
            : isSelected ? 'ring-2 ring-indigo-400 ring-offset-2' : 'border border-gray-200 dark:border-border',
          headerColorClass
        ]"
        v-bind="$attrs"
        @mouseover="onMouseOver"
        @mousedown="showHandles"
        @mouseout="onMouseOut">

      <!-- Drop overlay shown when hovering during a connection drag -->
      <Transition name="drop-overlay">
        <div v-if="isConnectHovered"
          class="absolute inset-0 rounded-xl pointer-events-none z-50 flex items-center justify-center"
          style="background: hsl(var(--primary) / 0.07); border: 2px dashed hsl(var(--primary));">
          <span class="flex items-center gap-1.5 text-xs font-semibold text-primary bg-white/90 dark:bg-card/90 px-2.5 py-1 rounded-full shadow-sm border border-primary/30">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Relâcher pour connecter
          </span>
        </div>
      </Transition>

      <!-- Entity header -->
      <div class="flex justify-center items-center border-b border-gray-100 dark:border-border rounded-t-xl py-3 px-4 md:px-5 relative"
           :class="isConnectHovered ? 'bg-primary/5' : headerBgClass">
        <h3 v-if="props?.data?.name !== ''" class="text-sm font-semibold text-center text-gray-800 dark:text-foreground tracking-wide uppercase">
          {{ props?.data?.name ?? 'Sans nom' }}
        </h3>
        <h3 v-else class="text-sm font-semibold text-center text-muted-foreground tracking-wide uppercase italic">Sans nom</h3>
      </div>

      <!-- Entity fields -->
      <div class="px-4 py-3 space-y-0.5">
        <div class="flex justify-between items-center gap-4 py-1 rounded-md px-1 hover:bg-accent/50 transition-colors"
             v-for="(field,index) in props?.data?.properties"
             :key="index">
          <div class="flex items-center gap-1 min-w-0">
            <div class="w-4 flex-shrink-0" v-if="field?.isPrimaryKey">
              <KeyRound :size="12" class="text-red-500"/>
            </div>
            <div class="w-4 flex-shrink-0" v-else-if="field?.isForeignKey">
            <KeyRound :size="12" class="text-muted-foreground"/>
          </div>
          <div v-else class="w-4 flex-shrink-0"></div>

            <span :class="{ 'underline decoration-red-400 decoration-2 underline-offset-2' : field?.isPrimaryKey }"
                  class="truncate text-sm font-medium text-foreground">
              {{ field?.isForeignKey ? '#' : '' }}{{ field?.propertyName }}
            </span>
          </div>

          <div class="flex items-center gap-1 flex-shrink-0">
            <!-- Type badge: hidden in MCD, shown in default/MLD/MPD -->
            <span v-if="modelType !== 'mcd' && field?.typeName" class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {{ field?.typeName }}
            </span>

            <!-- MPD: show NOT NULL / NULL badge -->
            <span v-if="modelType === 'mpd'" class="text-[10px] px-1 py-0.5 rounded font-mono"
                  :class="field?.isNullable ? 'text-muted-foreground bg-muted' : 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400'">
              {{ field?.isNullable ? 'NULL' : 'NOT NULL' }}
            </span>

            <!-- MPD: show AUTO_INCREMENT -->
            <span v-if="modelType === 'mpd' && field?.autoIncrement" class="text-[10px] text-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-1 py-0.5 rounded font-mono">
              AI
            </span>

            <!-- MLD/MPD: show UNIQUE -->
            <span v-if="(modelType === 'mld' || modelType === 'mpd') && field?.isUnique" class="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-1 py-0.5 rounded font-mono">
              UQ
            </span>

            <!-- Nullable toggle: only in editable (default) mode -->
            <template v-if="!isReadOnly">
              <div class="w-4" v-if="field?.propertyName !== 'id'">
                <NullableIcon class="w-4 h-4 cursor-pointer transition-colors"
                              @click="field.isNullable = !field.isNullable"
                              :class="[field?.isNullable ?
                                        'text-foreground' :
                                        'text-muted-foreground/50']"
                />
              </div>
              <div v-else class="w-4"></div>
            </template>
          </div>
        </div>

        <!-- Timestamp fields (dimmed) - only in default and MLD views -->
        <template v-if="props?.data?.hasTimestamps">
          <div class="flex justify-between items-center gap-4 py-1 px-1">
            <div class="flex items-center gap-1">
              <div class="w-4"></div>
              <span class="text-xs text-muted-foreground italic">created_at</span>
            </div>
            <div class="flex items-center gap-1">
              <span v-if="modelType !== 'mcd'" class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Timestamp</span>
              <NullableIcon v-if="!isReadOnly" class="w-4 h-4 text-muted-foreground"/>
            </div>
          </div>

          <div class="flex justify-between items-center gap-4 py-1 px-1">
            <div class="flex items-center gap-1">
              <div class="w-4"></div>
              <span class="text-xs text-muted-foreground italic">updated_at</span>
            </div>
            <div class="flex items-center gap-1">
              <span v-if="modelType !== 'mcd'" class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Timestamp</span>
              <NullableIcon v-if="!isReadOnly" class="w-4 h-4 text-muted-foreground"/>
            </div>
          </div>
        </template>

        <div v-if="props?.data?.usesSoftDeletes" class="flex justify-between items-center gap-4 py-1 px-1">
          <div class="flex items-center gap-1">
            <div class="w-4"></div>
            <span class="text-xs text-muted-foreground italic">deleted_at</span>
          </div>
          <div class="flex items-center gap-1">
            <span v-if="modelType !== 'mcd'" class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Timestamp</span>
            <NullableIcon v-if="!isReadOnly" class="w-4 h-4 text-muted-foreground"/>
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
        <ContextMenuItem @select="openRename" class="cursor-pointer">Renommer</ContextMenuItem>
        <ContextMenuItem @select="duplicateNode(props)" class="cursor-pointer">Dupliquer</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem class="cursor-pointer" @select="setNodeTimestamps(!getNodeTimestamps)">
          {{ getNodeTimestamps ? "Désactiver l'horodatage" : "Activer l'horodatage" }}
        </ContextMenuItem>
        <ContextMenuItem class="cursor-pointer" @select="setNodeSoftDeletes(!getNodeSoftDeletes)">
          {{ getNodeSoftDeletes ? 'Désactiver le soft-deletes' : 'Activer le soft-deletes' }}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem @select="handleDelete" class="text-red-500 cursor-pointer">Supprimer</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>

<script lang="ts" setup>
import {Handle, Position} from '@vue-flow/core'
import {computed, nextTick, ref, watch} from 'vue'
import {useModelStore} from "~/stores/model-store.js";
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


const mcdStore = useModelStore()
const {removeNode, duplicateNode} = mcdStore
const {activeTab, nodeIdSelected, isSaving, isConnecting, connectingSourceNodeId, connectHoveredNodeId} = storeToRefs(mcdStore)

const route = useRoute()
const isNodeShown = ref(false)
const isNodeHovered = ref(false)

/** Model type from the node data (set by generators). Defaults to editable mode. */
const modelType = computed(() => props.data?.modelType ?? 'default')
const isReadOnly = computed(() => modelType.value !== 'default')
const isSelected = computed(() => props.selected || nodeIdSelected.value === props.id)

// True when user is dragging a connection and this node is a valid target (not the source)
const isConnectTarget = computed(() =>
  isConnecting.value &&
  !isReadOnly.value &&
  props.id !== connectingSourceNodeId.value
)

// True when this node is the one currently hovered during a connection drag
const isConnectHovered = computed(() =>
  isConnectTarget.value && connectHoveredNodeId.value === props.id
)

/** Header background color per model type */
const headerBgClass = computed(() => {
  switch (modelType.value) {
    case 'mcd': return 'bg-blue-50/60 dark:bg-blue-950/30';
    case 'mld': return 'bg-emerald-50/60 dark:bg-emerald-950/30';
    case 'mpd': return 'bg-purple-50/60 dark:bg-purple-950/30';
    default: return 'bg-muted/50';
  }
})

const headerColorClass = computed(() => {
  if (!isReadOnly.value) return '';
  switch (modelType.value) {
    case 'mcd': return 'border-blue-200 dark:border-blue-800';
    case 'mld': return 'border-emerald-200 dark:border-emerald-800';
    case 'mpd': return 'border-purple-200 dark:border-purple-800';
    default: return '';
  }
})

watch(isSelected, (newVal) => {
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
    const prevData = JSON.parse(JSON.stringify(nodeData.data))
    nodeData.data.hasTimestamps = value
    await updateNode(prevData)
  }
}
const setNodeSoftDeletes = async value => {
  let nodeData = mcdStore?.flowMCD?.findNode(props.id);
  if (nodeData) {
    const prevData = JSON.parse(JSON.stringify(nodeData.data))
    nodeData.data.usesSoftDeletes = value
    await updateNode(prevData)
  }
}

const updateNode = async (previousData = null) => {
  isSaving.value = true;
  await mcdStore.updateNode(route.params.idModel, props?.id, previousData)
  isSaving.value = false;
};

// Open ElementMenu with focus on the name field
const openRename = () => {
  nodeIdSelected.value = props.id
  mcdStore.isNewlyCreated = true
  mcdStore.isSubMenuVisible = true
}

// Defer deletion so the ContextMenu portal closes before the component unmounts
const handleDelete = () => {
  nextTick(() => {
    removeNode(route.params.idModel, props.id)
  })
};

const sourceHandle = ref(0)


const sourceHandleStyle = computed(() => {
  return {
    backgroundColor: '#6366f1',
    padding: '8px',
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
  isNodeShown.value = false
  isNodeHovered.value = false
  sourceHandle.value = 0
}

const onMouseOver = () => {
  if (!isConnecting.value) showHandles()
  if (isConnecting.value && isConnectTarget.value) {
    connectHoveredNodeId.value = props.id
  }
}

const onMouseOut = () => {
  if (!isSelected.value) hideHandles()
  if (connectHoveredNodeId.value === props.id) {
    connectHoveredNodeId.value = null
  }
}


</script>

<style scoped>
.vue-flow__handle {
  width: 10px;
  height: 10px;
  transition: width 0.15s ease, height 0.15s ease, box-shadow 0.15s ease;
}

.vue-flow__handle:hover {
  width: 14px;
  height: 14px;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.18), 0 2px 4px rgba(0, 0, 0, 0.12);
}

/* Invisible hit area around each handle for easier edge creation */
.vue-flow__handle::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border-radius: 50%;
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

/* Drop overlay transition */
.drop-overlay-enter-active,
.drop-overlay-leave-active {
  transition: opacity 0.12s ease;
}
.drop-overlay-enter-from,
.drop-overlay-leave-to {
  opacity: 0;
}
</style>
