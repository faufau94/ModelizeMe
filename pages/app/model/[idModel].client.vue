<template>
  <div class="dndflow relative">

    <ElementMenu/>

    <VueFlow
        :id="getFlowId"
        :key="activeTab"
        :edgeTypes="edgeTypes"
        :nodeTypes="nodeTypes"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="(e) => onDrop(e, route.params.idModel)"
        @nodes-change="onChange"
        @edges-change="onChange"
        @edge-update="onEdgeUpdate"
    >
      <MiniMap/>
      <Controls/>

      <Panel position="top-left" class="bg-white z-40 px-2 py-1 drop-shadow-md flex items-center rounded-sm space-x-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button @click="goBack" variant="ghost"
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
            <Button @click="showDialogRenameModel = true; setValues({name: model.name})" variant="ghost" class=" border-none rounded-sm">
              {{ model?.name.length > 20 ? model?.name.substring(0, 20) + '...' : model?.name }}
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[425px]" v-if="showDialogRenameModel">
            <DialogHeader>
              <DialogTitle>Renommer le nom</DialogTitle>
            </DialogHeader>

            <form @submit="rnModel">
              <FormField v-slot="{ componentField }" name="name">
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                  <FormControl class="float-right">
                    <DialogFooter>

                    <DialogClose as-child>
                      <Button type="button" variant="secondary">
                        Annuler
                      </Button>
                    </DialogClose>
                    <Button type="submit" :disabled="isRenamingModel">
                      <Loader2 v-if="isRenamingModel" class="w-4 h-4 mr-2 animate-spin"/>
                      {{ isRenamingModel ? 'Changement...' : 'Renommer' }}
                    </Button>
                    </DialogFooter>
                  </FormControl>
                </FormItem>
              </FormField>
            </form>
          </DialogContent>
        </Dialog>

        <Separator orientation="vertical" class="h-6"/>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <CreateGaleryTemplate />
            </TooltipTrigger>
            <TooltipContent class="bg-black text-white">
              <p>Créer un modèle de galerie</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" class="h-6"/>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <ExportImportDropdown :vueFlowRef="currentFlow.vueFlowRef" :modelName="model?.name" />
            </TooltipTrigger>
            <TooltipContent class="bg-black text-white">
              <p>Exporter</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" class="h-6"/>

        <div>
          <PricingDialog />
        </div>
      </Panel>

      <Panel v-if="activeTab === 'mcd'" position="top-center"
             class="bg-white z-40 px-2 py-1 drop-shadow-md flex items-center rounded-sm space-x-1">

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
                  variant="ghost"
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
                  variant="ghost"
                  disabled
                  class="border-none rounded-sm"
              >
                <Undo2 :size="18"/>
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
                  variant="ghost"
                  disabled
                  class="border-none rounded-sm"
              >
                <Redo2 :size="18"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-black text-white">
              <p>Redo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" class="h-6"/>


        <Button
            disabled
            @click="autoLayout('LR')"
            variant="ghost"
            class="border-none rounded-sm"
        >
          <Workflow :size="18"/>
        </Button>

        <Separator orientation="vertical" class="h-6"/>


        <Button
            disabled
            @click="reorganize"
            variant="ghost"
            class="border-none rounded-sm"
        >
          <WandSparkles :size="18"/>
        </Button>

        <Separator orientation="vertical" class="h-6"/>

        <div class="px-3">
          <ActiveUsersAvatars :activeUsers="activeUsers" :maxVisible="3" />
        </div>

      </Panel>

      <Panel position="top-right" class="bg-white mr-10 z-40 drop-shadow-md flex items-center rounded-sm">
        <Tabs default-value="mcd" v-model="activeTab" class="w-full">
          <TabsList class="grid grid-cols-3">

            <!-- MCD Tab with Tooltip -->
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <TabsTrigger :disabled="isChangingTab" value="mcd">MCD</TabsTrigger>
                </TooltipTrigger>
                <TooltipContent class="bg-black text-white">
                  <p>Modèle Conceptuel de Données</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <!-- MLD Tab with Tooltip -->
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <TabsTrigger
                      :class="[mcdStore.flowMCD.nodes.length === 0 ? 'cursor-none' : 'cursor-pointer']"
                      :disabled="mcdStore.flowMCD.nodes.length === 0 || isChangingTab"
                      value="mld">
                    MLD
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent class="bg-black text-white">
                  <p>Modèle Logique de Données</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <!-- MPD Tab with Tooltip -->
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <TabsTrigger
                      :class="[mcdStore.flowMCD.nodes.length === 0 ? 'cursor-none' : 'cursor-pointer']"
                      :disabled="mcdStore.flowMCD.nodes.length === 0 || isChangingTab"
                      value="mpd">
                    MPD
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent class="bg-black text-white">
                  <p>Modèle Physique de Données</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsList>
        </Tabs>
      </Panel>

      <DropzoneBackground
          v-if="activeTab === 'mcd'"
          :style="{
          backgroundColor: isDragOver ? '#e0eefa' : 'transparent',
          transition: 'background-color 0.2s ease',
        }"
      >
      </DropzoneBackground>


      <template #connection-line="{ sourceX, sourceY, targetX, targetY, sourceNode, targetNode }">
        <CustomEdge v-if="sourceNode && targetNode" :source-x="sourceX" :source-y="sourceY" :target-x="targetX" :target-y="targetY" :source-node="sourceNode" :target-node="targetNode"/>
      </template>
    </VueFlow>

    <div class="absolute top-0 left-0 pointer-events-none z-[1000] w-full h-full">
      
    <div class="remote-cursors">
      <div v-for="user in remoteCursors" 
           :key="user.name" 
           class="remote-cursor"
           :style="{
             left: user.cursor ? `${flowToScreenPosition(user.cursor).x}px` : '0px',
             top: user.cursor ? `${flowToScreenPosition(user.cursor).y}px` : '0px',
             '--color': user.color
           }">
        <div class="remote-cursor-dot" :style="{ backgroundColor: user.color }"></div>
        <span class="remote-cursor-name" :style="{ backgroundColor: user.color }">{{ user.name }}</span>
      </div>
    </div>
    </div>

    
  </div>

</template>

<script setup>
import {computed, markRaw, nextTick, onMounted, onUnmounted, ref, watch} from "vue";
import CustomEdge from "~/components/flow/CustomEdge.vue";
import ElementMenu from "~/components/flow/ElementMenu.vue";
import {Panel, useVueFlow, VueFlow} from "@vue-flow/core";
import DropzoneBackground from "~/components/flow/DropzoneBackground.vue";
import {MiniMap} from "@vue-flow/minimap";
import {Controls} from "@vue-flow/controls";
import CustomEntity from "~/components/flow/MyCustomEntity.vue";
import CustomEntityAssociation from "~/components/flow/MyCustomEntityAssociation.vue";
import {useMCDStore} from "~/stores/mcd-store.js";
import {useMLDStore} from "~/stores/mld-store.js";
import {useMPDStore} from "~/stores/mpd-store.js";
import useDragAndDrop from "~/utils/useDnd.js";
import {storeToRefs} from "pinia";
import {Check, Loader2, PanelTop, Redo2, Undo2, WandSparkles, Workflow} from "lucide-vue-next";
import {Separator} from '@/components/ui/separator'
import PricingDialog from "@/components/PricingDialog.vue";
import {Dialog, DialogContent, DialogFooter, DialogTrigger,} from '@/components/ui/dialog'
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {useCollaborationStore} from '~/stores/collaboration-store.js';

import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'
import {useLayout} from "@/composables/useLayout.js";
import {elkOptions, getLayoutedElements} from '@/utils/useElk.js';
import ExportImportDropdown from "@/components/flow/ExportImportDropdown.vue";

import {toTypedSchema} from "@vee-validate/zod";
import {z} from "zod/v4";
import {useForm} from 'vee-validate'
import CreateGaleryTemplate from "@/components/flow/CreateGaleryTemplate.vue";

import {useModel} from '@/composables/api/useModel'
import {authClient} from '~/lib/auth-client'
import ActiveUsersAvatars from '@/components/ActiveUsersAvatars.vue'


const route = useRoute()
const router = useRouter()

const model = ref(null)

const mcdStore = useMCDStore()
const mldStore = useMLDStore()
const mpdStore = useMPDStore()
const {addNode} = mcdStore
const {isSubMenuVisible, nodeIdSelected, edgeIdSelected, elementsMenu, addNewNode, activeTab, edgeType} = storeToRefs(mcdStore)

const {onDragOver, onDragLeave, isDragOver, onDrop, onDragStart} = useDragAndDrop()

const collaborationStore = useCollaborationStore();

const nodeTypes = {
  customEntity: markRaw(CustomEntity),
  customEntityAssociation: markRaw(CustomEntityAssociation),
}

const edgeTypes = {
  customEdge: markRaw(CustomEdge)
};


const isRenamingModel = ref(false)
const showDialogRenameModel = ref(false)


const { activeUsers, remoteCursors } = storeToRefs(collaborationStore)


mcdStore.setFlowInstance(useVueFlow('flow-mcd-' + route.params.idModel))
mldStore.setFlowInstance(useVueFlow('flow-mld-' + route.params.idModel))
mpdStore.setFlowInstance(useVueFlow('flow-mpd-' + route.params.idModel))

mcdStore.flowMCD.onPaneClick((e) => {
  if (activeTab.value === 'mcd') {
    if (isSubMenuVisible.value)
      isSubMenuVisible.value = false
    elementsMenu.value = false
    nodeIdSelected.value = null
    edgeIdSelected.value = null
  }
})


const { data: session } = await authClient.useSession(useFetch)
console.log('session', session.value)

collaborationStore.initialize(route.params.idModel, session.value.user.name);

onMounted(async () => {

  // Fetch initial model data from backend
  model.value = await $fetch("/api/models/read", {
    method: "GET",
    query: { id: route.params.idModel },
  });

  // Set initial nodes/edges in Yjs (if not already present)
  if (model.value?.nodes?.length) {
    collaborationStore.setNodes(model.value.nodes);
  }
  if (model.value?.edges?.length) {
    collaborationStore.setEdges(model.value.edges);
  }

  if(model.value) {
    setValues({
      name: model.value.name,
    });
  }

  mcdStore.flowMCD.onConnect((params) => {
    const newEdge = mcdStore.createNewEdge(params)
    // Use shared edges instead of directly adding to flow
    collaborationStore.addEdge(newEdge)

    isSubMenuVisible.value = true
    elementsMenu.value = false
    edgeIdSelected.value = newEdge.id
    nodeIdSelected.value = null
  })

  mcdStore.flowMCD.onNodeClick((e) => {
    if (activeTab.value === 'mcd') {
      edgeIdSelected.value = null
      isSubMenuVisible.value = true
      nodeIdSelected.value = e.node.id


    }
  })

  mcdStore.flowMCD.onEdgeClick((e) => {
    if (activeTab.value === 'mcd') {
      nodeIdSelected.value = null
      isSubMenuVisible.value = true
      edgeIdSelected.value = e.edge.id
    }
  })

  await nextTick(() => {
    mcdStore.flowMCD.fitView({ padding: 0.4 })
  })

  await nextTick(); // Ensure DOM is updated and .dndflow exists
  collaborationStore.setupCursorTracking();
})

onUnmounted(() => {
  activeTab.value = 'mcd'
  collaborationStore.cleanup();
})

const onChange = (changes) => {
  // changes are arrays of type `NodeChange` or `EdgeChange`
  if (changes.length > 0 &&
      changes[0].type === 'position' &&
      changes[0].dragging === false &&
      changes[0].id.startsWith('dndnode') &&
      activeTab.value === 'mcd'
  ) {
    console.log('onChange', changes)
    mcdStore.updateNode(route.params.idModel, changes[0].id)
  }
}

const onEdgeUpdate = async ({edge, connection}) => {
  mcdStore.flowMCD.updateEdge(edge, connection, false)
  await mcdStore.updateEdge(route.params.idModel, edge.id)
}


const formSchema = toTypedSchema(z.object({
  name: z.string({
    error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : ""
  }).min(2, 'Le nom doit être supérieur à 2 caractères.').max(50),
}))


const { handleSubmit, setValues } = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: ''
  },
  validateOnMount: false,
})

const { renameModel } = useModel()
const rnModel = handleSubmit(async (values) => {
  isRenamingModel.value = true
  renameModel(model.value.id,{name: values.name})

  model.value.name = values.name
  isRenamingModel.value = false
  showDialogRenameModel.value = false
})

const goBack = async () => {
  isSubMenuVisible.value = false
  router.back()
}

// Tabs
const getFlowId = computed(() => {
  if (activeTab.value === 'mcd') return 'flow-mcd-' + route.params.idModel;
  if (activeTab.value === 'mld') return 'flow-mld-' + route.params.idModel;
  if (activeTab.value === 'mpd') return 'flow-mpd-' + route.params.idModel;
  return 'flow-mcd-' + route.params.idModel; // Default to MCD
});

const isChangingTab = ref(false)

const currentFlow = ref(mcdStore.flowMCD)

watch(activeTab, () => {
  isChangingTab.value = true
  if (activeTab.value === 'mcd') currentFlow.value = mcdStore.flowMCD;
  if (activeTab.value === 'mld') {
    const { nodesMLD, edgesMLD } = mldStore.generateMLD(mcdStore.flowMCD.getNodes, mcdStore.flowMCD.getEdges)
    mldStore.flowMLD.setNodes(nodesMLD)
    mldStore.flowMLD.setEdges(edgesMLD)
    currentFlow.value = mldStore.flowMLD;
    console.log("nodesMLD", nodesMLD);
  }
  if (activeTab.value === 'mpd') currentFlow.value = {nodes: [], edges: []};

  nextTick(() => {
    currentFlow.value.fitView()
  })
  isChangingTab.value = false
})

// just for testing
const autoLayout = (direction) => {
  const { nodes, edges } = useLayout(currentFlow?.value, direction);
  mcdStore.flowMCD.setNodes(nodes);
  mcdStore.flowMCD.setEdges(edges);

  // Adjust the view to fit the new layout
  nextTick(() => {
    mcdStore.flowMCD.fitView({ padding: 0.4 })
  })
}


const reorganize = () => {
  const opts = { ...elkOptions };
  const ns = currentFlow.value.getNodes;
  const es = currentFlow.value.getEdges;

  getLayoutedElements(ns, es, opts).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
    mcdStore.flowMCD.setNodes(layoutedNodes);
    mcdStore.flowMCD.setEdges(layoutedEdges);

    nextTick(() => {
      mcdStore.flowMCD.fitView({ padding: 0.4 });
    });
  });
};


/*
const reorganize = () => {
  const { reorganizeNodesAndEdges } = useReorganize(currentFlow?.value);

// Applique la réorganisation des nodes pour éviter les chevauchements
  const { nodes, edges } = reorganizeNodesAndEdges();


  mcdStore.flowMCD.setNodes(nodes);
  mcdStore.flowMCD.setEdges(edges);


  // Adjust the view to fit the new layout
  nextTick(() => {
    mcdStore.flowMCD.fitView({ padding: 0.1 })
  })
}

 */

const flowToScreenPosition = (flowPosition) => {
  if (!currentFlow.value || !flowPosition) return { x: 0, y: 0 }
  
  // Convert flow coordinates back to screen coordinates
  return currentFlow.value.flowToScreenCoordinate(flowPosition)
}

</script>

<style>
.remote-cursors {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1000;
  width: 100%;
  height: 100%;
}

.remote-cursor {
  position: absolute;
  transform: translate(-50%, -50%);
  transition: all 0.1s ease;
}

.remote-cursor-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.remote-cursor-name {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--color);
  padding: 2px 6px;
  border-radius: 3px;
  color: white;
  font-size: 12px;
  margin-top: 5px;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
</style>
