<template>

    <div
        ref="content"
        class="bg-white shadow-md rounded-[50px] z-40 w-80 relative hover:bg-zinc-50 cursor-pointer"
        :class="props.selected || edgeIdSelected === props.id ? 'border-2 border-blue-400 transition-all duration-400' : 'border-2 border-transparent'"
        v-bind="$attrs"
        @mouseover="showHandles"
        @mouseout="hideHandles">

      <div class="flex justify-center items-center rounded-t-xl py-3 px-4 md:px-5">
        <h3 v-if="props?.data?.name !== ''" class="text-lg font-bold text-center text-gray-800">
          {{ props?.data?.name }}
        </h3>
        <h3 v-else class="text-lg font-bold text-center text-gray-400">Sans nom</h3>
      </div>
      <hr >
      <div class="md:px-4 py-5" >
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

            <div :class="{ 'underline' : field?.isPrimaryKey }">
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

    </div>
</template>

<script lang="ts" setup>
import {inject, onMounted, onUpdated, ref} from 'vue'
import {useMCDStore} from "~/stores/mcd-store.js";
import {KeyRound, Trash2} from 'lucide-vue-next';
import {Button} from '@/components/ui/button';
import {storeToRefs} from "pinia";
import NullableIcon from '@/components/icon/nullable-icon';

const mcdStore = useMCDStore()
const {edgeIdSelected} = storeToRefs(mcdStore)
const {duplicateNode, removeNode, updateNode} = mcdStore
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
})


const sourceHandle = ref(0)

const isEdgeShown = ref(false)
const isEdgeHovered = ref(false)

const showHandles = () => {
  isEdgeShown.value = true
  isEdgeHovered.value = true
  sourceHandle.value = 1
}

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

const hideHandles = () => {
  setTimeout(() => {
    if (isEdgeHovered.value) isEdgeShown.value = false
    isEdgeHovered.value = false
  }, 3000)

  sourceHandle.value = 0
}

</script>

