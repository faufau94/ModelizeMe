<template>

  <div
      ref="content"
       class="bg-white shadow-md rounded-[50px] z-40 relative hover:bg-zinc-50 cursor-pointer"
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
      <div class="flex justify-between items-center py-1" v-for="(field,index) in props?.data?.properties" :key="index">
        <div class="flex font-semibold items-center justify-center">
          <div class="w-3 " v-if="field?.isPrimaryKey">
            <KeyRound :size="13" class="text-red-500" />
          </div>
          <div v-else class="w-3"></div>

          <div class="px-2" :class="{ 'underline' : field?.isPrimaryKey }">
            {{ field?.propertyName }}
          </div>
        </div>
        <div class=" pr-3">
          {{ field?.typeName }}
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

const mcdStore = useMCDStore()
const {foreignObjectHeight, edgeIdSelected} = storeToRefs(mcdStore)
const content = ref(null);


// Watch for changes in content and update height
const updateHeight = () => {
  if (content.value) {
    foreignObjectHeight.value = content.value.offsetHeight;
  }
};

onMounted(() => {
  updateHeight();
});

onUpdated(() => {
  updateHeight();
});


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

const hideHandles = () => {
  setTimeout(() => {
    if (isEdgeHovered.value) isEdgeShown.value = false
    isEdgeHovered.value = false
  }, 3000)

  sourceHandle.value = 0
}

</script>

