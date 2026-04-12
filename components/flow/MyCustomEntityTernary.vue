<template>
  <ContextMenu>
    <ContextMenuTrigger :disabled="isReadOnly">
  <div
    ref="content"
    class="bg-white dark:bg-card relative cursor-pointer transition-all duration-200 nodrag"
    :class="isSelected
      ? 'ring-2 ring-indigo-400 ring-offset-2 shadow-lg'
      : 'shadow-md hover:shadow-lg border border-border'"
    style="border-radius: 14px; min-width: 160px; max-width: 240px;"
    v-bind="$attrs"
  >
    <!-- Name header -->
    <div class="flex items-center justify-center gap-1.5 px-4 pt-3 pb-2 border-b border-border">
      <h3
        v-if="props.data?.name"
        class="text-xs font-semibold text-center text-foreground tracking-wide uppercase truncate"
      >
        {{ props.data.name }}
      </h3>
      <h3 v-else class="text-xs font-semibold text-center text-muted-foreground tracking-wide uppercase italic">
        Sans nom
      </h3>
    </div>

    <!-- Fields -->
    <div v-if="props.data?.properties?.length" class="px-3 py-2 space-y-0.5">
      <div
        v-for="(field, index) in props.data.properties"
        :key="index"
        class="flex items-center justify-between gap-3 py-0.5 px-1 rounded hover:bg-accent/50 transition-colors"
      >
        <div class="flex items-center gap-1 min-w-0">
          <div class="w-3.5 flex-shrink-0" v-if="field?.isPrimaryKey">
            <KeyRound :size="11" class="text-red-500"/>
          </div>
          <div class="w-3.5 flex-shrink-0" v-else-if="field?.isForeignKey">
            <KeyRound :size="11" class="text-muted-foreground"/>
          </div>
          <div v-else class="w-3.5 flex-shrink-0"></div>

          <span
            class="text-xs text-foreground truncate"
            :class="field?.isPrimaryKey ? 'font-semibold underline decoration-red-400 decoration-2 underline-offset-2' : 'font-normal'"
          >
            {{ field?.isForeignKey ? '#' : '' }}{{ field?.propertyName }}
          </span>
        </div>

        <span class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0 border border-border">
          {{ field?.typeName }}
        </span>
      </div>

      <!-- Timestamps -->
      <div v-if="props.data?.hasTimestamps" class="flex items-center justify-between gap-3 py-0.5 px-1">
        <span class="text-xs text-muted-foreground/60 italic w-3.5 inline-block"></span>
        <span class="text-xs text-muted-foreground/60 italic flex-1">created_at</span>
        <span class="text-xs text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded border border-border">Timestamp</span>
      </div>
      <div v-if="props.data?.hasTimestamps" class="flex items-center justify-between gap-3 py-0.5 px-1">
        <span class="text-xs text-muted-foreground/60 italic w-3.5 inline-block"></span>
        <span class="text-xs text-muted-foreground/60 italic flex-1">updated_at</span>
        <span class="text-xs text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded border border-border">Timestamp</span>
      </div>
      <div v-if="props.data?.usesSoftDeletes" class="flex items-center justify-between gap-3 py-0.5 px-1">
        <span class="text-xs text-muted-foreground/60 italic w-3.5 inline-block"></span>
        <span class="text-xs text-muted-foreground/60 italic flex-1">deleted_at</span>
        <span class="text-xs text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded border border-border">Timestamp</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="px-3 py-2">
      <p class="text-xs text-muted-foreground italic text-center">Aucun champ</p>
    </div>

    <!-- CIF indicator -->
    <div v-if="hasCIF" class="flex items-center justify-center px-3 pb-2">
      <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-300 rounded px-2 py-0.5">
        CIF
      </span>
    </div>

    <div class="pb-1"></div>
  </div>
    </ContextMenuTrigger>
    <ContextMenuContent v-if="!isReadOnly">
      <ContextMenuItem @select="openRename" class="cursor-pointer">Renommer</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem @select="setNodeTimestamps(!getNodeTimestamps)" class="cursor-pointer">
        {{ getNodeTimestamps ? "Désactiver l'horodatage" : "Activer l'horodatage" }}
      </ContextMenuItem>
      <ContextMenuItem @select="setNodeSoftDeletes(!getNodeSoftDeletes)" class="cursor-pointer">
        {{ getNodeSoftDeletes ? 'Désactiver le soft-deletes' : 'Activer le soft-deletes' }}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem @select="handleDelete" class="text-red-500 cursor-pointer">Supprimer</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue';
import { useModelStore } from '~/stores/model-store.js';
import { KeyRound } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

const mcdStore = useModelStore();
const { removeNode, updateNode: storeUpdateNode } = mcdStore;
const { nodeIdSelected, isSaving } = storeToRefs(mcdStore);
const content = ref(null);
const route = useRoute();

const props = defineProps({
  id: { type: String, required: true },
  selected: { type: Boolean, required: false },
  data: { type: Object, required: false },
});

const modelType = computed(() => props.data?.modelType ?? 'default');
const isReadOnly = computed(() => modelType.value !== 'default');
const isSelected = computed(() => props.selected || nodeIdSelected.value === props.id);

const getNodeTimestamps = computed(() => props.data?.hasTimestamps);
const getNodeSoftDeletes = computed(() => props.data?.usesSoftDeletes);

const setNodeTimestamps = async (value: boolean) => {
  const nodeData = mcdStore.flowMCD?.findNode(props.id);
  if (nodeData) {
    const prevData = JSON.parse(JSON.stringify(nodeData.data));
    nodeData.data.hasTimestamps = value;
    isSaving.value = true;
    await storeUpdateNode(route.params.idModel, props.id, prevData);
    isSaving.value = false;
  }
};

const setNodeSoftDeletes = async (value: boolean) => {
  const nodeData = mcdStore.flowMCD?.findNode(props.id);
  if (nodeData) {
    const prevData = JSON.parse(JSON.stringify(nodeData.data));
    nodeData.data.usesSoftDeletes = value;
    isSaving.value = true;
    await storeUpdateNode(route.params.idModel, props.id, prevData);
    isSaving.value = false;
  }
};

const openRename = () => {
  nodeIdSelected.value = props.id;
  mcdStore.isNewlyCreated = true;
  mcdStore.isSubMenuVisible = true;
};

const handleDelete = () => {
  nextTick(() => {
    removeNode(route.params.idModel, props.id);
  });
};

// Check if any connected edge has CIF
const hasCIF = computed(() => {
  if (!mcdStore.flowMCD) return false;
  const edges = mcdStore.flowMCD.getEdges?.value ?? [];
  return edges.some(
    (e) => (e.source === props.id || e.target === props.id) && e.data?.isCIF
  );
});
</script>
