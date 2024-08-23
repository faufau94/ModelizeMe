<template>
  <div class="dndflow">
    <VueFlow
        :id="'flow-mcd-' + route.params.idModel"
        :edges="edges"
        :nodes="nodes"
        :edgeTypes="edgeTypes"
        :nodeTypes="nodeTypes"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
    >
      <MiniMap/>
      <Controls/>

      <Panel position="top-left" class="bg-white px-2 py-1 drop-shadow-md flex items-center rounded-sm space-x-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button @click="async() => await navigateTo('/app/dashboard')" variant="outline"
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

            <Input v-model="model.name" type="text"/>

            <DialogFooter class="mt-3">
              <DialogClose as-child>
                <Button type="button" variant="secondary">
                  Fermer
                </Button>
              </DialogClose>
              <Button @click="onSubmit" :disabled="isRenamingModel">
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
                <Download :size="18"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-black text-white">
              <p>Exporter</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" class="h-6"/>


        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button variant="outline" class="border-none rounded-sm">
                <PanelTop :size="18"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-black text-white">
              <p>Ajouter un nœud</p>
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
import {markRaw, onMounted} from "vue";
import CustomEdge from "~/components/flow/MyCustomEdge.vue";
import {useVueFlow, VueFlow, Panel} from "@vue-flow/core";
import DropzoneBackground from "~/components/flow/DropzoneBackground.vue";
import {MiniMap} from "@vue-flow/minimap";
import {Controls} from "@vue-flow/controls";
import CustomEntity from "~/components/flow/MyCustomEntity.vue";
import CustomEntityAssociation from "~/components/flow/MyCustomEntityAssociation.vue";
import {useMCDStore} from "~/stores/mcd-store.js";
import useDragAndDrop from "~/utils/useDnd.js";
import {storeToRefs} from "pinia";
import {PanelTop, Download, CirclePlus, Loader2} from "lucide-vue-next";
import {Separator} from '@/components/ui/separator'
import {Dialog, DialogContent, DialogFooter, DialogTrigger,} from '@/components/ui/dialog'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

const route = useRoute()

const {
  onInit,
  addNodes,
  addEdges,
  nodes,
  edges,
  onConnect,
  onNodeClick,
  onEdgeClick
} = useVueFlow({id: 'flow-mcd-' + route.params.idModel})

const mcdStore = useMCDStore()

const {isSubMenuVisible, nodeIdSelected, edgeIdSelected, elementsMenu} = storeToRefs(mcdStore)

const {onDragOver, onDragLeave, isDragOver, onDrop} = useDragAndDrop()

const nodeTypes = {
  customEntity: markRaw(CustomEntity),
  customEntityAssociation: markRaw(CustomEntityAssociation),
}

const edgeTypes = {
  customEdge: markRaw(CustomEdge),
};

const model = ref(null)

onMounted(async () => {

  model.value = await $fetch("/api/models/read", {
    method: "GET",
    query: {id: route.params.idModel},
  });

  console.log(model.value.name)

  if (model.value.nodes.length !== 0) {
    addNodes(model.value.nodes)
  }

  if (model.value.edges.length !== 0) {
    addEdges(model.value.edges)
  }


  onConnect((params) => {

    let newEdgeId = mcdStore.getIdEdge();
    let newEdge = {
      id: newEdgeId,
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      type: 'customEdge',
      updatable: true,
      selectable: true,
      style: null,
      label: '',
      data: {
        name: '',
        sourceCardinality: '',
        targetCardinality: '',
        properties: []
      }
    }

    addEdges([newEdge])

    isSubMenuVisible.value = true
    elementsMenu.value = false
    edgeIdSelected.value = newEdgeId
    nodeIdSelected.value = null

  })

  onNodeClick((e) => {
    edgeIdSelected.value = null
    isSubMenuVisible.value = true
    nodeIdSelected.value = e.node.id
  })

  onEdgeClick((e) => {
    nodeIdSelected.value = null
    isSubMenuVisible.value = true
    edgeIdSelected.value = e.edge.id
  })
})

const isRenamingModel = ref(false)
const showDialogRenameModel = ref(false)
const onSubmit = async () => {
  console.log('model.value.name',model.value.name)
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
</script>
