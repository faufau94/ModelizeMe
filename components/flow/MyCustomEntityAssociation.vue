<template>

  <div
      class="bg-white shadow-md rounded-[50px] w-60 h-full border border-transparent hover:border hover:border-1.5 hover:border-blue-600"
      v-bind="$attrs"
      @mouseover="showHandles"
      @mouseout="hideHandles">

    <div class="flex justify-center items-center rounded-t-xl py-3 px-4 md:px-5">
      <h3 v-if="props?.data?.name !== ''" class="text-lg font-bold text-center text-gray-800">
        {{ props?.data?.name }}
      </h3>
      <h3 v-else class="text-lg font-bold text-center text-gray-400">Sans nom</h3>
    </div>
    <hr v-if="props?.data?.properties?.length !== 0">
    <div class="md:px-5 py-3" v-if="props?.data?.properties?.length !== 0">
      <div class="flex justify-between items-center gap-6  py-1" v-for="field in props?.data?.properties">
        <div class="flex font-semibold items-center justify-center">
          <div class=" w-8" v-if="field?.propertyName === 'Big Increment'">
            <KeyRound :size="18" class="text-red-500" />
          </div>
          <div v-else class="w-8"></div>

          <div :class="{ 'underline' : field?.propertyName === 'id' }">
            {{ field?.propertyName }}
          </div>
        </div>
        <div class="">
          {{ field?.typeName }}
        </div>
      </div>
    </div>

  </div>
</template>

<script lang="ts" setup>
import {useNodesData} from '@vue-flow/core'
import {computed, ref} from 'vue'
import {useMCDStore} from "~/stores/mcd-store.js";
import {storeToRefs} from "pinia";

const mcdStore = useMCDStore()
const {isSubMenuVisible, nodeIdSelected} = storeToRefs(mcdStore)

const nodeData = useNodesData(nodeIdSelected)

const props = defineProps({
  id: {
    type: String,
    required: false,
  },
  data: {
    type: Object,
    required: false,
  },
})

const entityDatas = ref({
  name: '',
  properties: [
    {
      propertyName: "",
      typeName: ""
    },
  ]
})

const removeNode = (id) => {
  mcdStore.flowMCD.removeNodes(id, true, true);
  isSubMenuVisible.value = false
}


const sourceHandle = ref(0)

const addProperty = () => {

  entityDatas.value.properties.push({
    propertyName: "",
    typeName: ""
  })

  mcdStore.flowMCD.setNodes((nds) =>
      nds.map((node) => {
        if (node.id === props.id) {

          node.data.properties = [
            ...entityDatas.value.properties
          ]

        }
        return node;
      })
  )
}

const changeProperty = index => {

  mcdStore.flowMCD.setNodes((nds) =>
      nds.map((node) => {
        if (node.id === props.id) {

          node.data.properties = [
            ...entityDatas.value.properties,
          ]
        }

        return node;
      })
  )

}

const changeName = event => {

  if (entityDatas.value.name === '') {
    entityDatas.value.properties[0].propertyName = ''
  } else {
    entityDatas.value.properties[0].propertyName = `Id${event.charAt(0).toUpperCase() + event.slice(1)}`
  }

  // Update first key and node name
  mcdStore.flowMCD.setNodes((nds) =>
      nds.map((node) => {
        if (node.id === props.id) {

          node.data.name = entityDatas.value.name
          node.data.properties[0].propertyName = entityDatas.value.properties[0].propertyName
        }

        return node;
      })
  )
}

const nodeSelected = id => {
  isSubMenuVisible.value = true
  nodeIdSelected.value = id
}


const removeProperty = (index) => {

  entityDatas.value.properties.splice(index, 1)

  mcdStore.flowMCD.setNodes((nds) =>
      nds.map((node) => {
        if (node.id === props.id) {

          node.data.properties = entityDatas.value.properties
        }

        return node;
      })
  )
}


const sourceHandleStyle = computed(() => {
  return {
    backgroundColor: '#8392A6',
    padding: '5px',
    opacity: sourceHandle.value
  }
})

const showHandles = () => {
  sourceHandle.value = 1
}

const hideHandles = () => {
  sourceHandle.value = 0
}

</script>

