<template>

  <div class="bg-white shadow-md rounded-2xl w-80 z-40 relative hover:bg-zinc-50"
       :class="props.selected ? 'border-2 border-blue-400 transition-all duration-400' : 'border-2 border-transparent'"
       v-bind="$attrs"
       @mouseover="showHandles"
       @mouseout="hideHandles">

    <NodeToolbar
        v-if="activeTab === 'mcd'"
        class="p-1 bg-white rounded-md"
        @mouseover="isNodeHovered = false"
        @mouseout="isNodeHovered = true"
        :is-visible="isNodeShown" :position="Position.Top">
      <Button @click="removeNodeById(props.id)" variant="outline" class=" border-none rounded-sm">
        <Trash2 class="text-red-500" :size="20"/>
      </Button>
      <Button @click="duplicateNode()" variant="outline" class=" border-none rounded-sm">
        <Copy class="text-gray-600" :size="20"/>
      </Button>

    </NodeToolbar>


    <div class="flex justify-center items-center border-b rounded-t-xl py-3 px-4 md:px-5">
      <div>

      </div>
      <h3 v-if="props?.data?.name !== ''" class="text-lg font-bold text-center text-gray-800">
        {{ props?.data?.name.toUpperCase() }}
      </h3>
      <h3 v-else class="text-lg font-bold text-center text-gray-400">Sans nom</h3>
    </div>
    <div class="p-4 md:px-5">
      <div class="flex justify-between items-center gap-6 py-1" v-for="(field,index) in props?.data?.properties" :key="index">
        <div class="flex font-bold items-center justify-center">
          <div class="w-5" v-if="field?.isPrimaryKey">
            <KeyRound :size="13" class="text-red-500" />
          </div>
          <div class="w-5" v-else-if="field?.isForeignKey">
            <KeyRound :size="13" class="text-gray-500" />
          </div>
          <div v-else class="w-5"></div>

          <div :class="{ 'underline' : field?.isPrimaryKey }">
            {{ field?.isForeignKey ? '#' : '' }}{{ field?.propertyName }}
          </div>
        </div>
        <div class="">
          {{ field?.typeName }}
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'mcd'">
      <Handle id="s1"  type="source" :position="Position.Left" :style="sourceHandleStyle"/>
      <Handle id="s2"  type="source" :position="Position.Top" :style="sourceHandleStyle"/>
      <Handle id="s3"  type="source" :position="Position.Bottom" :style="sourceHandleStyle"/>
      <Handle id="s4"  type="source" :position="Position.Right" :style="sourceHandleStyle"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {Handle, Position, useNodesData} from '@vue-flow/core'
import {computed, ref} from 'vue'
import {useMCDStore} from "~/stores/mcd-store.js";
import {storeToRefs} from "pinia";
import { NodeToolbar } from '@vue-flow/node-toolbar'
import {Trash2, Copy, KeyRound} from "lucide-vue-next";

const mcdStore = useMCDStore()
const {removeNode, createNewNode, addNode} = mcdStore
const {activeTab} = storeToRefs(mcdStore)

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

const entityDatas = ref({
  name: '',
  properties: [
    {
      propertyName: "",
      typeName: ""
    },
  ]
})

const route = useRoute()

const isNodeShown = ref(false)
const isNodeHovered = ref(false)

const removeNodeById = idNode => {
  removeNode(route.params.idModel, idNode)
}

const duplicateNode = async () => {
  let maxOffset = 50
  // position close to the duplicated node
  let positionNewNode = {
        x: props?.position.x + (Math.random() * maxOffset * 2 - maxOffset),
        y: props?.position.y + (Math.random() * maxOffset * 2 - maxOffset)
      }
  let newNode = createNewNode(positionNewNode)
  let data = {...props.data}
  newNode = {
    ...newNode,
    data: data
  }

  await addNode(route.params.idModel, newNode)

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


