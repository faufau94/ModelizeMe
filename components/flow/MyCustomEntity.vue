<template>

  <ContextMenu>
    <ContextMenuTrigger>
    <div class="bg-white shadow-md rounded-2xl w-80 z-40 relative hover:bg-zinc-50 cursor-pointer"
        :class="nodeIdSelected === props.id ? 'border-2 border-blue-400 transition-all duration-400' : 'border-2 border-transparent'"
        v-bind="$attrs"
        @mouseover="showHandles"
        @mousedown="showHandles"
        @mouseout="nodeIdSelected === props.id ? showHandles : hideHandles()">

      <!-- <NodeToolbar
          v-if="activeTab === 'mcd'"
          class="p-1 bg-white rounded-md"
          @mouseover="isNodeHovered = false"
          @mouseout="isNodeHovered = true"
          :is-visible="isNodeShown" :position="Position.Top">
        <Button @click="removeNode(route.params.idModel, props.id)" variant="outline" class=" border-none rounded-sm">
          <Trash2 class="text-red-500" :size="20"/>
        </Button>
        <Button @click="duplicateNode(props)" variant="outline" class=" border-none rounded-sm">
          <Copy class="text-gray-600" :size="20"/>
        </Button>

      </NodeToolbar> -->


      <div class="flex justify-center items-center border-b rounded-t-xl py-3 px-4 md:px-5">
        <div>

        </div>
        <h3 v-if="props?.data?.name !== ''" class="text-lg font-bold text-center text-gray-800">
          {{ props?.data?.name?.toUpperCase() ?? 'Sans nom' }}
        </h3>
        <h3 v-else class="text-lg font-bold text-center text-gray-400">Sans nom</h3>
      </div>
      <div class="p-4 md:px-5">
        <div class="flex justify-between items-center gap-6 py-1" v-for="(field,index) in props?.data?.properties"
            :key="index">
          <div class="flex font-bold items-center justify-center">
            <div class="w-5" v-if="field?.isPrimaryKey">
              <KeyRound :size="13" class="text-red-500"/>
            </div>
            <div class="w-5" v-else-if="field?.isForeignKey">
              <KeyRound :size="13" class="text-gray-500"/>
            </div>
            <div v-else class="w-5"></div>

            <div :class="{ 'underline' : field?.isPrimaryKey }" class="truncate w-32">
              {{ field?.isForeignKey ? '#' : '' }}{{ field?.propertyName }}
            </div>
          </div>

          <div class="flex justify-end items-end">
            <div class="">
              {{ field?.typeName }}
            </div>
            <div class="w-5" v-if="field?.propertyName !== 'id'">
              <NullableIcon class="w-5 h-5 cursor-pointer"
                            @click="field.isNullable = !field.isNullable"
                            :class="[field?.isNullable ?
                                      'text-black' :
                                      'text-gray-400']"
              />
            </div>
            <div v-else class="w-5"></div>
          </div>
        </div>


        <div v-if="props?.data?.hasTimestamps" class="flex justify-between items-center gap-6 py-1">
          <div class="flex font-bold items-center justify-center">
            <div class="w-5"></div>

            <div class="text-gray-500 font-normal">
              created_at
            </div>
          </div>
          <div class="flex justify-end items-end">
            <div class="">
              Timestamp
            </div>

            <div>
              <NullableIcon class="w-5 h-5 cursor-pointer text-black"/>
            </div>
          </div>
        </div>

        <div v-if="props?.data?.hasTimestamps" class="flex justify-between items-center gap-6 py-1">
          <div class="flex font-bold items-center justify-center">
            <div class="w-5"></div>
            <div class="text-gray-500 font-normal">
              updated_at
            </div>
          </div>
          <div class="flex justify-end items-end">
            <div class="">
              Timestamp
            </div>

            <div>
              <NullableIcon class="w-5 h-5 cursor-pointer text-black"/>
            </div>
          </div>
        </div>

        <div v-if="props?.data?.usesSoftDeletes" class="flex justify-between items-center gap-6 py-1">
          <div class="flex font-bold items-center justify-center">
            <div class="w-5"></div>

            <div class="text-gray-500 font-normal">
              deleted_at
            </div>
          </div>
          <div class="flex justify-end items-end">
            <div class="">
              Timestamp
            </div>

            <div>
              <NullableIcon class="w-5 h-5 cursor-pointer text-black"/>
            </div>
          </div>
        </div>

      </div>

      <div v-if="activeTab === 'mcd'">
        <Handle id="s1" type="source" :position="Position.Left" :style="sourceHandleStyle"/>
        <Handle id="s2" type="source" :position="Position.Top" :style="sourceHandleStyle"/>
        <Handle id="s3" type="source" :position="Position.Bottom" :style="sourceHandleStyle"/>
        <Handle id="s4" type="source" :position="Position.Right" :style="sourceHandleStyle"/>
      </div>
    </div>
    </ContextMenuTrigger>
    <ContextMenuContent>
        <ContextMenuItem @click="duplicateNode(props)" class="cursor-pointer">Dupliquer</ContextMenuItem>
        <ContextMenuItem class="cursor-pointer" as-child @click="setNodeTimestamps(!getNodeTimestamps)">
          <div v-if="getNodeTimestamps">
            Désactiver l’horodatage
          </div>
          <div v-else>
            Activer l’horodatage
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
import {Handle, Position, useNodesData} from '@vue-flow/core'
import {computed, ref, watch} from 'vue'
import {useMCDStore} from "~/stores/mcd-store.js";
import {storeToRefs} from "pinia";
import {NodeToolbar} from '@vue-flow/node-toolbar'
import {Trash2, Copy, KeyRound} from "lucide-vue-next";
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

watch(() => nodeIdSelected.value === props.id, (newVal) => {
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

// const nodeTimestamps = computed({
//   get() {
//     return nodeData?.value?.data?.hasTimestamps;
//   },
//   set(value) {
//     if (nodeData && nodeData.value.data) {
//       nodeData.value.data.hasTimestamps = value;
//     }
//   },
// });

// const nodeSoftDeletes = computed({
//   get() {
//     return nodeData?.value?.data?.usesSoftDeletes;
//   },
//   set(value) {
//     if (nodeData && nodeData.value.data) {
//       nodeData.value.data.usesSoftDeletes = value;
//     }
//   },
// });

const sourceHandle = ref(0)


const sourceHandleStyle = computed(() => {
  return {
    backgroundColor: '#8392A6',
    padding: '7px',
    opacity: sourceHandle.value,
  }
})

const showHandles = () => {
  isNodeShown.value = true
  isNodeHovered.value = true
  sourceHandle.value = 1
}

const hideHandles = () => {
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


