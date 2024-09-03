<template>
  <div class="dndflow relative">

    <ElementMenu />

    <VueFlow
        :id="'flow-mcd-' + route.params.idModel"
        :edges="flowMCD?.edges"
        :nodes="flowMCD?.nodes"
        :edgeTypes="edgeTypes"
        :nodeTypes="nodeTypes"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="(e) => onDrop(e, route.params.idModel)"
        @nodes-change="onChange"
        @edges-change="onChange"
        @edge-update="onEdgeUpdate"
        fit-view-on-init
    >
      <MiniMap/>
      <Controls/>

      <Panel position="top-left" class="bg-white z-40 px-2 py-1 drop-shadow-md flex items-center rounded-sm space-x-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button @click="goBack" variant="outline"
                      class="border-none rounded-sm">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-6 w-6"
                >
                  <path d="m8 3 4 8 5-5 5 15H2L8 3z"></path>
                </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-black text-white">
              <p>Retour au tableau de bord</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" class="h-6"/>

        <Dialog>
          <DialogTrigger as-child>
            <Button @click="showDialogRenameModel = true" variant="outline" class=" border-none rounded-sm">
              {{ model?.name }}
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[425px]" v-if="showDialogRenameModel">
            <DialogHeader>
              <DialogTitle>Renommer le nom</DialogTitle>
            </DialogHeader>

            <Input @keyup.enter="renameModel" v-model="model.name" type="text"/>

            <DialogFooter class="mt-3">
              <DialogClose as-child>
                <Button type="button" variant="secondary">
                  Annuler
                </Button>
              </DialogClose>
              <Button @click="renameModel" :disabled="isRenamingModel">
                <Loader2 v-if="isRenamingModel" class="w-4 h-4 mr-2 animate-spin"/>
                {{ isRenamingModel ? 'Ajout...' : 'Ajouter' }}
              </Button>
            </DialogFooter>

          </DialogContent>
        </Dialog>

        <Separator orientation="vertical" class="h-6"/>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button variant="outline" class=" border-none rounded-sm">
                <Settings2 :size="18"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-black text-white">
              <p>Paramètres</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" class="h-6"/>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button variant="outline" class=" border-none rounded-sm">
                <Download :size="18"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-black text-white">
              <p>Exporter</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" class="h-6"/>

        <div class="px-2">
          <Button variant="outline" size="xs">
            Mettre à niveau
          </Button>
        </div>
      </Panel>

      <Panel position="top-center" class="bg-white z-40 px-2 py-1 drop-shadow-md flex items-center rounded-sm space-x-1">

        <div v-if="addNewNode" class="flex justify-between items-center gap-3 px-2 transition duration-150">
          <Loader2 :size="18" class="animate-spin"/>
          <span class="text-sm">Enregistrement...</span>
        </div>
        <div v-else class="flex justify-between items-center gap-3 px-2 transition duration-150">
          <Check :size="18"/>
          <span class="text-sm">Enregistré</span>
        </div>

        <Separator orientation="vertical" class="h-6"/>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                  @click="addNode(route.params.idModel)"
                  :draggable="true"
                  @dragstart="onDragStart($event, 'input')"
                  variant="outline"
                  class="border-none rounded-sm"
              >
                <PanelTop :size="18"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-black text-white">
              <p>Ajouter un nœud</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>


        <Separator orientation="vertical" class="h-6"/>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                  variant="outline"
                  class="border-none rounded-sm"
              >
                <Undo2 :size="18" />
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-black text-white">
              <p>Undo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" class="h-6"/>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                  variant="outline"
                  class="border-none rounded-sm"
              >
                <Redo2 :size="18" />
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-black text-white">
              <p>Redo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>


      </Panel>

      <DropzoneBackground
          :style="{
          backgroundColor: isDragOver ? '#e0eefa' : 'transparent',
          transition: 'background-color 0.2s ease',
        }"
      >
      </DropzoneBackground>

      <template #connection-line="{ sourceX, sourceY, targetX, targetY }">
        <CustomEdge :source-x="sourceX" :source-y="sourceY" :target-x="targetX" :target-y="targetY"/>
      </template>
    </VueFlow>
  </div>

</template>

<script setup>
import {computed, markRaw, onMounted, ref} from "vue";
import CustomEdge from "~/components/flow/MyCustomEdge.vue";
import ElementMenu from "~/components/flow/ElementMenu.vue";
import {useVueFlow, VueFlow, Panel} from "@vue-flow/core";
import DropzoneBackground from "~/components/flow/DropzoneBackground.vue";
import {MiniMap} from "@vue-flow/minimap";
import {Controls} from "@vue-flow/controls";
import CustomEntity from "~/components/flow/MyCustomEntity.vue";
import CustomEntityAssociation from "~/components/flow/MyCustomEntityAssociation.vue";
import {useMCDStore} from "~/stores/mcd-store.js";
import useDragAndDrop from "~/utils/useDnd.js";
import {storeToRefs} from "pinia";
import {PanelTop, Download, Undo2, Redo2, Loader2, Check, Settings2, Trash2} from "lucide-vue-next";
import {Separator} from '@/components/ui/separator'
import {Dialog, DialogContent, DialogFooter, DialogTrigger,} from '@/components/ui/dialog'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

const route = useRoute()


const mcdStore = useMCDStore()
const {addNode} = mcdStore
const {isSubMenuVisible, nodeIdSelected, edgeIdSelected, elementsMenu, addNewNode} = storeToRefs(mcdStore)

const {onDragOver, onDragLeave, isDragOver, onDrop, onDragStart} = useDragAndDrop()

const nodeTypes = {
  customEntity: markRaw(CustomEntity),
  customEntityAssociation: markRaw(CustomEntityAssociation),
}

const edgeTypes = {
  customEdge: markRaw(CustomEdge),
};

const model = ref(null)

const flowMCD = computed(() => mcdStore.flowMCD);
mcdStore.setFlowInstance(useVueFlow({id: 'flow-mcd-' + route.params.idModel}))

mcdStore.flowMCD.onPaneClick((e) => {
  if (isSubMenuVisible.value)
    isSubMenuVisible.value = false
  elementsMenu.value = false
  nodeIdSelected.value = null
  edgeIdSelected.value = null
})

onMounted(async () => {


  model.value = await $fetch("/api/models/read", {
    method: "GET",
    query: {id: route.params.idModel},
  });

  if (model.value.nodes.length !== 0) {
    flowMCD.value.addNodes(model.value.nodes)
  }

  if (model.value.edges.length !== 0) {
    flowMCD.value.addEdges(model.value.edges)
  }


  flowMCD.value.onConnect((params) => {

    const newEdge = mcdStore.createNewEdge(params)

    flowMCD.value.addEdges([newEdge])

    isSubMenuVisible.value = true
    elementsMenu.value = false
    edgeIdSelected.value = newEdge.id
    nodeIdSelected.value = null

  })



  flowMCD.value.onNodeClick((e) => {
    edgeIdSelected.value = null
    isSubMenuVisible.value = true
    nodeIdSelected.value = e.node.id
  })

  flowMCD.value.onEdgeClick((e) => {
    nodeIdSelected.value = null
    isSubMenuVisible.value = true
    edgeIdSelected.value = e.edge.id
  })
})

const onChange = (changes) => {
  // changes are arrays of type `NodeChange` or `EdgeChange`
  if(changes.length > 0 &&
      changes[0].type === 'position' &&
      changes[0].dragging === false &&
      changes[0].id.startsWith('dndnode')) {
    mcdStore.updateNode(route.params.idModel, changes[0].id)
  }
}

const onEdgeUpdate = async ({ edge, connection }) => {
  mcdStore.flowMCD.updateEdge(edge, connection, false)
  await mcdStore.updateEdge(route.params.idModel, edge.id)
}


const isRenamingModel = ref(false)
const showDialogRenameModel = ref(false)
const renameModel = async () => {
  isRenamingModel.value = true
  const res = await $fetch(`/api/models/rename-model?id=${route.params.idModel}`, {
    method: "PUT",
    body: {
      name: model.value.name
    }
  });

  if (res) {
    isRenamingModel.value = false
    showDialogRenameModel.value = false
  }
}

const goBack = async() => {
  isSubMenuVisible.value = false
  await navigateTo('/app')
}

</script>
