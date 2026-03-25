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

      <!-- Unified top toolbar -->
      <Panel position="top-left" class="bg-white/95 backdrop-blur-sm z-40 px-3 py-1.5 shadow-md flex items-center rounded-lg space-x-1 border border-gray-100">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button @click="goBack" variant="ghost" size="sm" class="rounded-md hover:bg-gray-100">
                <ArrowLeft :size="18"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-gray-900 text-white text-xs">
              <p>Retour au tableau de bord</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" class="h-5 bg-gray-200"/>

        <Dialog>
          <DialogTrigger as-child>
            <Button @click="showDialogRenameModel = true; setValues({name: model.name})" variant="ghost" size="sm" class="rounded-md font-medium text-gray-700 hover:bg-gray-100 max-w-[180px] truncate">
              {{ model?.name.length > 20 ? model?.name.substring(0, 20) + '...' : model?.name }}
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[425px]" v-if="showDialogRenameModel">
            <DialogHeader>
              <DialogTitle>Renommer le modèle</DialogTitle>
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

        <Separator orientation="vertical" class="h-5 bg-gray-200"/>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <CreateGaleryTemplate />
            </TooltipTrigger>
            <TooltipContent class="bg-gray-900 text-white text-xs">
              <p>Sauvegarder comme template</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <ExportImportDropdown :vueFlowRef="currentFlow.vueFlowRef" :import-items="importItems" :export-items="exportItems" />
            </TooltipTrigger>
            <TooltipContent class="bg-gray-900 text-white text-xs">
              <p>Import / Export</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <PricingDialog />
      </Panel>

      <!-- Center toolbar: MCD actions + save status -->
      <Panel v-if="activeTab === 'default'" position="top-center"
             class="bg-white/95 backdrop-blur-sm z-40 px-3 py-1.5 shadow-md flex items-center rounded-lg space-x-1 border border-gray-100">

        <div v-if="addNewNode" class="flex items-center gap-2 px-2 text-amber-600 transition-all duration-200">
          <Loader2 :size="16" class="animate-spin"/>
          <span class="text-xs font-medium">Enregistrement...</span>
        </div>
        <div v-else class="flex items-center gap-2 px-2 text-green-600 transition-all duration-200">
          <Check :size="16"/>
          <span class="text-xs font-medium">Sauvegardé</span>
        </div>

        <Separator orientation="vertical" class="h-5 bg-gray-200"/>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                  @click="addNode(route.params.idModel)"
                  :draggable="true"
                  @dragstart="onDragStart($event, 'input')"
                  variant="ghost"
                  size="sm"
                  class="rounded-md hover:bg-blue-50 hover:text-blue-600"
              >
                <PanelTop :size="16"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-gray-900 text-white text-xs">
              <p>Ajouter une entité</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" class="h-5 bg-gray-200"/>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                  variant="ghost"
                  disabled
                  size="sm"
                  class="rounded-md"
              >
                <Undo2 :size="16"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-gray-900 text-white text-xs">
              <p>Annuler</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                  variant="ghost"
                  disabled
                  size="sm"
                  class="rounded-md"
              >
                <Redo2 :size="16"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-gray-900 text-white text-xs">
              <p>Rétablir</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" class="h-5 bg-gray-200"/>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                  disabled
                  @click="autoLayout('LR')"
                  variant="ghost"
                  size="sm"
                  class="rounded-md"
              >
                <Workflow :size="16"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-gray-900 text-white text-xs">
              <p>Auto-layout</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                  disabled
                  @click="reorganize"
                  variant="ghost"
                  size="sm"
                  class="rounded-md"
              >
                <WandSparkles :size="16"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-gray-900 text-white text-xs">
              <p>Réorganiser</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" class="h-5 bg-gray-200"/>

        <div class="pl-1">
          <ActiveUsersAvatars :activeUsers="activeUsers" :maxVisible="3" />
        </div>

      </Panel>

      <!-- Tab switcher: MCD / MLD / MPD -->
      <Panel position="top-right" class="bg-white/95 backdrop-blur-sm mr-10 z-40 shadow-md flex items-center rounded-lg border border-gray-100">
        <Tabs default-value="default" v-model="activeTab" class="w-full">
          <TabsList class="grid grid-cols-4">

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <TabsTrigger :disabled="isChangingTab" value="default">Modèle</TabsTrigger>
                </TooltipTrigger>
                <TooltipContent class="bg-gray-900 text-white text-xs">
                  <p>Vue éditable du modèle</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <TabsTrigger
                      :class="[hasNoNodes ? 'cursor-not-allowed' : 'cursor-pointer']"
                      :disabled="hasNoNodes || isChangingTab"
                      value="mcd">
                    MCD
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent class="bg-gray-900 text-white text-xs">
                  <p>Modèle Conceptuel de Données (lecture seule)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <TabsTrigger
                      :class="[hasNoNodes ? 'cursor-not-allowed' : 'cursor-pointer']"
                      :disabled="hasNoNodes || isChangingTab"
                      value="mld">
                    MLD
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent class="bg-gray-900 text-white text-xs">
                  <p>Modèle Logique de Données (lecture seule)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <TabsTrigger
                      :class="[hasNoNodes ? 'cursor-not-allowed' : 'cursor-pointer']"
                      :disabled="hasNoNodes || isChangingTab"
                      value="mpd">
                    MPD
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent class="bg-gray-900 text-white text-xs">
                  <p>Modèle Physique de Données (lecture seule)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsList>
        </Tabs>
      </Panel>

      <DropzoneBackground
          v-if="activeTab === 'default'"
          :style="{
          backgroundColor: isDragOver ? '#e0eefa' : 'transparent',
          transition: 'background-color 0.2s ease',
        }"
      >
      </DropzoneBackground>


      <template #connection-line="{ sourceX, sourceY, targetX, targetY, sourceNode }">
        <FloatingConnectionLine
          :from-node="sourceNode"
          :to-x="targetX"
          :to-y="targetY"
        />
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
import FloatingConnectionLine from "~/components/flow/FloatingConnectionLine.vue";
import ElementMenu from "~/components/flow/ElementMenu.vue";
import {Panel, useVueFlow, VueFlow} from "@vue-flow/core";
import DropzoneBackground from "~/components/flow/DropzoneBackground.vue";
import {MiniMap} from "@vue-flow/minimap";
import {Controls} from "@vue-flow/controls";
import CustomEntity from "~/components/flow/MyCustomEntity.vue";
import CustomEntityAssociation from "~/components/flow/MyCustomEntityAssociation.vue";
import {useMCDStore} from "~/stores/mcd-store.js";
import {useMCDGenStore} from "~/stores/mcd-gen-store.js";
import {useMLDStore} from "~/stores/mld-store.js";
import {useMPDStore} from "~/stores/mpd-store.js";
import useDragAndDrop from "~/utils/useDnd.js";
import {storeToRefs} from "pinia";
import {ArrowLeft, Check, Loader2, PanelTop, Redo2, Undo2, WandSparkles, Workflow} from "lucide-vue-next";
import {Separator} from '@/components/ui/separator'
import PricingDialog from "@/components/PricingDialog.vue";
import {Dialog, DialogContent, DialogFooter, DialogTrigger,} from '@/components/ui/dialog'
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {useCollaborationStore} from '~/stores/collaboration-store.js';

import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'
import {useLayout} from "@/composables/useLayout.js";
import {computeElkOptions, getLayoutedElements} from '@/utils/useElk.js';
import ExportImportDropdown from "@/components/flow/ExportImportDropdown.vue";

import {toTypedSchema} from "@vee-validate/zod";
import {z} from "zod/v4";
import {useForm} from 'vee-validate'
import CreateGaleryTemplate from "@/components/flow/CreateGaleryTemplate.vue";

import {useModel} from '@/composables/api/useModel'
import {authClient} from '~/lib/auth-client'
import ActiveUsersAvatars from '@/components/ActiveUsersAvatars.vue'
import { useScreenshot } from '@/composables/useScreenshot';
import {toast} from "vue-sonner";

const route = useRoute()
const router = useRouter()

const model = ref(null)

const mcdStore = useMCDStore()
const mcdGenStore = useMCDGenStore()
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


const mcdFlowInstance = useVueFlow('flow-mcd-' + route.params.idModel)
mcdStore.setFlowInstance(mcdFlowInstance)
mcdGenStore.setFlowInstance(useVueFlow('flow-mcd-gen-' + route.params.idModel))
mldStore.setFlowInstance(useVueFlow('flow-mld-' + route.params.idModel))
mpdStore.setFlowInstance(useVueFlow('flow-mpd-' + route.params.idModel))

mcdStore.flowMCD.onPaneClick((e) => {
  if (activeTab.value === 'default') {
    if (isSubMenuVisible.value)
      isSubMenuVisible.value = false
    elementsMenu.value = false
    nodeIdSelected.value = null
    edgeIdSelected.value = null
  }
})


const { data: session } = await authClient.useSession(useFetch)
console.log('session', session.value)

// Initialize collaboration with proper auth token
const sessionToken = session.value?.session?.token || ''
collaborationStore.initialize(
  route.params.idModel,
  session.value.user.name,
  sessionToken,
  session.value.user.id,
  session.value.user.image
);

onMounted(async () => {

  // Always start with a clean slate to avoid stale data from previous models
  mcdStore.flowMCD.setNodes([]);
  mcdStore.flowMCD.setEdges([]);

  // Fetch initial model data from backend
  model.value = await $fetch("/api/models/read", {
    method: "GET",
    query: { id: route.params.idModel },
  });

  // Set initial nodes/edges in Yjs AND VueFlow — always, even if empty
  const initialNodes = model.value?.nodes || [];
  const initialEdges = model.value?.edges || [];
  collaborationStore.setNodes(initialNodes);
  mcdStore.flowMCD.setNodes(initialNodes);
  collaborationStore.setEdges(initialEdges);
  mcdStore.flowMCD.setEdges(initialEdges);

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
    if (activeTab.value === 'default') {
      edgeIdSelected.value = null
      isSubMenuVisible.value = true
      nodeIdSelected.value = e.node.id
    }
  })

  mcdStore.flowMCD.onEdgeClick((e) => {
    if (activeTab.value === 'default') {
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
  activeTab.value = 'default'
  collaborationStore.cleanup();
})

const onChange = async (changes) => {
  for (const change of changes) {
    // Only persist position changes when dragging ends
    if (
      change.type === 'position' &&
      change.dragging === false &&
      change.id.startsWith('dndnode') &&
      activeTab.value === 'default'
    ) {
      // mcdStore.updateNode already persists to DB + syncs via collaborationStore
      await mcdStore.updateNode(route.params.idModel, change.id)
    }
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
  if (activeTab.value === 'default') return 'flow-mcd-' + route.params.idModel;
  if (activeTab.value === 'mcd') return 'flow-mcd-gen-' + route.params.idModel;
  if (activeTab.value === 'mld') return 'flow-mld-' + route.params.idModel;
  if (activeTab.value === 'mpd') return 'flow-mpd-' + route.params.idModel;
  return 'flow-mcd-' + route.params.idModel;
});

const isChangingTab = ref(false)

const currentFlow = ref(mcdStore.flowMCD)

const hasNoNodes = computed(() => {
  // Use the local VueFlow instance ref directly for proper reactivity tracking
  return mcdFlowInstance.getNodes.value.length === 0
})

watch(activeTab, () => {
  isChangingTab.value = true
  isSubMenuVisible.value = false
  nodeIdSelected.value = null
  edgeIdSelected.value = null

  if (activeTab.value === 'default') {
    currentFlow.value = mcdStore.flowMCD;
  }
  if (activeTab.value === 'mcd') {
    // Generate read-only MCD from the editable model
    // .nodes/.edges are auto-unwrapped by reactive(), no .value needed
    const { nodesMCD, edgesMCD } = mcdGenStore.generateMCD(
      mcdStore.flowMCD.nodes,
      mcdStore.flowMCD.edges
    )
    mcdGenStore.flowMCDGen.setNodes(nodesMCD)
    mcdGenStore.flowMCDGen.setEdges(edgesMCD)
    currentFlow.value = mcdGenStore.flowMCDGen;
  }
  if (activeTab.value === 'mld') {
    const { nodesMLD, edgesMLD } = mldStore.generateMLD(
      mcdStore.flowMCD.nodes,
      mcdStore.flowMCD.edges
    )
    mldStore.flowMLD.setNodes(nodesMLD)
    mldStore.flowMLD.setEdges(edgesMLD)
    currentFlow.value = mldStore.flowMLD;
  }
  if (activeTab.value === 'mpd') {
    const { nodesMPD, edgesMPD } = mpdStore.generateMPD(
      mcdStore.flowMCD.nodes,
      mcdStore.flowMCD.edges
    )
    mpdStore.flowMPD.setNodes(nodesMPD)
    mpdStore.flowMPD.setEdges(edgesMPD)
    currentFlow.value = mpdStore.flowMPD;
  }

  nextTick(() => {
    currentFlow.value?.fitView?.({ padding: 0.4 })
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
  const opts = computeElkOptions(currentFlow.value.getNodes);
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


const handleExport = (type) => {
  const flowElement = currentFlow.value.vueFlowRef;

  if (flowElement) {
    const { exportAsImage } = useScreenshot();
    exportAsImage(flowElement, type, model.value?.name);
  } else {
    console.warn('Current flow element not found');
  }
}

const exportToSQL = async (database) => {

    const getMCDModel = await $fetch("/api/models/read", {
      method: "GET",
      query: {id: route.params.idModel},
    });
    console.log('getMCDModel', getMCDModel)

    const {nodesMLD, edgesMLD} = mldStore.generateMLD(getMCDModel['nodes'],getMCDModel['edges'])

    const newTitle = getMCDModel?.name?.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_') +
      `_${Date.now()}_${crypto.randomUUID()}`;
    const response = await $fetch('/api/generator/generate-file', {
      method: 'POST',
      body: { title: newTitle, database: database , nodes: nodesMLD, edges: edgesMLD },
    });

    console.log('response', response)


  try {
    // Créer une URL Object pour le blob
    const blob = new Blob([response], {type: 'application/x-sql'});
    const url = window.URL.createObjectURL(blob);

    // Créer un élément <a> pour télécharger le fichier
    const a = document.createElement('a');
    a.href = url;
    a.download = `${newTitle}.sql`; // Nom du fichier à télécharger

    // Ajouter le lien au document et simuler un clic
    document.body.appendChild(a);
    a.click();

    // Nettoyer le document
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Export SQL généré avec succès !')
  } catch (e) {
      toast.error('Une erreur est survenue lors de l\'export SQL.')
  }


}

const importItems = [
  { title: 'Importer un fichier XML' },
  { title: 'Importer un fichier SQL (coming soon...)', disabled: true },
  { title: 'Importer un fichier JSON (coming soon...)', disabled: true },
];

const exportItems = [
  { title: 'Exporter en PNG', action: () => handleExport('png') },
  { title: 'Exporter en JPEG', action: () => handleExport('jpeg') },
    // Exporter en SQL
  { title: 'Exporter en SQL (MySQL)', action: () => exportToSQL('mysql') },
  { title: 'Exporter en SQL (PostgreSQL)', action: () => exportToSQL('pgsql') },
];
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
  transition: left 0.15s cubic-bezier(0.4, 0, 0.2, 1),
              top 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.remote-cursor-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.remote-cursor-name {
  position: absolute;
  top: 100%;
  left: 8px;
  transform: translateX(0);
  background-color: var(--color);
  padding: 1px 6px;
  border-radius: 4px;
  color: white;
  font-size: 11px;
  font-weight: 500;
  margin-top: 2px;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}
</style>
