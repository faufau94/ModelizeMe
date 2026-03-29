<template>
  <div class="dndflow relative">

    <ElementMenu/>

    <VueFlow
        v-if="isFlowReady"
        :id="getFlowId"
        :key="activeTab"
        :edgeTypes="edgeTypes"
        :nodeTypes="nodeTypes"
        :connection-radius="50"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="(e) => onDrop(e, route.params.idModel)"
        @nodes-change="onChange"
        @edges-change="onChange"
        @edge-update="onEdgeUpdate"
        @nodes-delete="onNodesDelete"
        @edges-delete="onEdgesDelete"
    >
      <MiniMap/>
      <Controls/>

      <!-- Ternary selection mode banner -->
      <Panel v-if="isTernaryMode" position="top-center" class="z-50">
        <div class="bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-4">
          <div class="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 10 10" class="text-indigo-200"><polygon points="5,0 10,5 5,10 0,5" fill="currentColor"/></svg>
            <span class="text-sm font-medium">
              Relation ternaire - Cliquez sur {{ 3 - ternarySelectedNodes.length }} entité{{ (3 - ternarySelectedNodes.length) > 1 ? 's' : '' }}
            </span>
          </div>
          <div v-if="ternarySelectedNodes.length > 0" class="flex gap-1">
            <span v-for="nId in ternarySelectedNodes" :key="nId" class="bg-indigo-500 text-xs px-2 py-0.5 rounded-full">
              {{ getNodeName(nId) }}
            </span>
          </div>
          <button @click="cancelTernaryMode" class="ml-2 text-indigo-200 hover:text-white text-sm underline">
            Annuler
          </button>
        </div>
      </Panel>

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

        <Dialog v-model:open="showDialogRenameModel">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <DialogTrigger as-child>
                  <Button @click="setValues({name: model.name})" variant="ghost" size="sm" class="rounded-md font-medium text-gray-700 hover:bg-gray-100 max-w-[400px] min-w-0 overflow-hidden">
                    <span class="truncate block">{{ model?.name }}</span>
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent class="bg-gray-900 text-white text-xs">
                <p>{{ model?.name }}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DialogContent class="sm:max-w-[425px]">
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
                </FormItem>
              </FormField>
              <DialogFooter class="mt-4">
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

        <Popover v-model:open="isEdgeStylePopoverOpen">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <PopoverTrigger as-child>
                  <Button variant="ghost" size="sm" class="rounded-md">
                    <Workflow :size="16"/>
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent class="bg-gray-900 text-white text-xs">
                <p>Style des connecteurs</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <PopoverContent side="bottom" align="center" class="w-52 p-2">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">Style des connecteurs</p>
            <div class="space-y-0.5">
              <button
                v-for="opt in edgeStyleOptions" :key="opt.value"
                class="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors"
                :class="edgePathStyle === opt.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'"
                @click="edgePathStyle = opt.value; isEdgeStylePopoverOpen = false"
              >
                <svg width="24" height="12" viewBox="0 0 24 12" class="flex-shrink-0">
                  <path :d="opt.preview" fill="none" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                {{ opt.label }}
              </button>
            </div>
          </PopoverContent>
        </Popover>

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
                  :disabled="!canUndo"
                  size="sm"
                  class="rounded-md"
                  @click="collaborationStore.undo()"
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
                  :disabled="!canRedo"
                  size="sm"
                  class="rounded-md"
                  @click="collaborationStore.redo()"
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
                  :disabled="activeTab !== 'default'"
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
import CustomEntityTernary from "~/components/flow/MyCustomEntityTernary.vue";
import {useMCDStore} from "~/stores/mcd-store.js";
import {useMCDGenStore} from "~/stores/mcd-gen-store.js";
import {useMLDStore} from "~/stores/mld-store.js";
import {useMPDStore} from "~/stores/mpd-store.js";
import useDragAndDrop from "~/utils/useDnd.js";
import {storeToRefs} from "pinia";
import {ArrowLeft, Check, Loader2, PanelTop, Redo2, Undo2, WandSparkles, Workflow} from "lucide-vue-next";
import {Separator} from '@/components/ui/separator'
import PricingDialog from "@/components/PricingDialog.vue";
import {Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,} from '@/components/ui/dialog'
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {useCollaborationStore} from '~/stores/collaboration-store.js';

import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'
import {computeElkOptions, getLayoutedElements, estimateNodeSize} from '@/utils/useElk.js';
import {findFreePosition} from '@/utils/useCollisions.js';
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
const {isSubMenuVisible, nodeIdSelected, edgeIdSelected, elementsMenu, addNewNode, activeTab, edgeType, isResolvingCollisions, isTernaryMode, ternarySelectedNodes, edgePathStyle} = storeToRefs(mcdStore)

const edgeStyleOptions = [
  { value: 'bezier', label: 'Courbe', preview: 'M 0 10 C 8 0, 16 0, 24 10' },
  { value: 'simpleBezier', label: 'Courbe douce', preview: 'M 0 10 Q 12 0 24 10' },
  { value: 'straight', label: 'Droit', preview: 'M 0 6 L 24 6' },
]

const isEdgeStylePopoverOpen = ref(false)

const {onDragOver, onDragLeave, isDragOver, onDrop, onDragStart} = useDragAndDrop()

// Ternary mode helpers
const getNodeName = (nodeId) => {
  const node = mcdStore.flowMCD?.findNode(nodeId)
  return node?.data?.name || 'Sans nom'
}

const cancelTernaryMode = () => {
  isTernaryMode.value = false
  ternarySelectedNodes.value = []
}

const handleTernaryNodeClick = async (nodeId) => {
  if (!isTernaryMode.value) return false
  const node = mcdStore.flowMCD?.findNode(nodeId)
  if (!node || node.type !== 'customEntity') return false

  const idx = ternarySelectedNodes.value.indexOf(nodeId)
  if (idx >= 0) {
    ternarySelectedNodes.value.splice(idx, 1)
  } else {
    ternarySelectedNodes.value.push(nodeId)
  }

  if (ternarySelectedNodes.value.length === 3) {
    await mcdStore.addTernaryRelation(route.params.idModel, [...ternarySelectedNodes.value])
    isTernaryMode.value = false
    ternarySelectedNodes.value = []
  }
  return true
}

const collaborationStore = useCollaborationStore();

const nodeTypes = {
  customEntity: markRaw(CustomEntity),
  customEntityAssociation: markRaw(CustomEntityAssociation),
  ternaryEntity: markRaw(CustomEntityTernary),
}

const edgeTypes = {
  customEdge: markRaw(CustomEdge)
};


const isRenamingModel = ref(false)
const showDialogRenameModel = ref(false)
const isFlowReady = ref(false)

const { activeUsers, remoteCursors, canUndo, canRedo } = storeToRefs(collaborationStore)


const mcdFlowInstance = useVueFlow('flow-mcd-' + route.params.idModel)
// Clear immediately to prevent flash of cached nodes from a previous visit
mcdFlowInstance.setNodes([])
mcdFlowInstance.setEdges([])
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
  try {
    model.value = await $fetch("/api/models/read", {
      method: "GET",
      query: { id: route.params.idModel },
    });
  } catch (error) {
    if (error?.statusCode === 401) {
      return navigateTo('/sign-in')
    }
    if (error?.statusCode === 403 || error?.statusCode === 404) {
      toast.error(error?.statusCode === 403
        ? "Vous n'avez pas accès à ce modèle."
        : "Modèle introuvable."
      )
      return navigateTo(`/app/workspace/${session.value?.session?.activeOrganizationId}/dashboard`)
    }
    toast.error("Une erreur est survenue lors du chargement du modèle.")
    return navigateTo(`/app/workspace/${session.value?.session?.activeOrganizationId}/dashboard`)
  }

  // Set initial nodes/edges in Yjs AND VueFlow.
  // Use skipTracking=true (origin='init') so UndoManager ignores the initial load.
  // Future edits will be tracked as deltas from this base state.
  const initialNodes = model.value?.nodes || [];
  const initialEdges = model.value?.edges || [];
  collaborationStore.setNodes(initialNodes, true);
  collaborationStore.setEdges(initialEdges, true);
  collaborationStore.clearUndoHistory();
  mcdStore.flowMCD.setNodes(initialNodes);
  mcdStore.flowMCD.setEdges(initialEdges);

  if(model.value) {
    setValues({
      name: model.value.name,
    });
  }

  // ─── Track connection start for "add node on edge drop" ───
  const _connectStartParams = ref(null)

  mcdStore.flowMCD.onConnectStart(({ event, nodeId, handleId, handleType }) => {
    _connectStartParams.value = { nodeId, handleId, handleType }
  })

  mcdStore.flowMCD.onConnectEnd((event) => {
    if (!_connectStartParams.value) return
    const startParams = _connectStartParams.value
    _connectStartParams.value = null

    // Only act when the edge was dropped on the empty pane (not on a valid handle)
    const targetEl = event?.target
    if (!targetEl) return
    const isPane = targetEl.classList.contains('vue-flow__pane')
    if (!isPane) return

    // Get the drop position in flow coordinates
    const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event
    const position = mcdFlowInstance.screenToFlowCoordinate({ x: clientX, y: clientY })

    // Create a new node + edge at the drop position
    mcdStore.addNodeAndEdge(
      route.params.idModel,
      position,
      startParams.nodeId,
      startParams.handleId
    )
  })

  mcdStore.flowMCD.onConnect((params) => {
    _connectStartParams.value = null
    const newEdge = mcdStore.createNewEdge(params)
    // Use shared edges instead of directly adding to flow
    collaborationStore.addEdge(newEdge)

    // Persist new edge to DB
    $fetch(`/api/models/update`, {
      method: 'PUT',
      query: { id: route.params.idModel },
      body: { edge: newEdge, type: 'edge', action: 'addEdge' },
    }).catch(() => {})

    isSubMenuVisible.value = true
    elementsMenu.value = false
    mcdStore.isNewlyCreated = true
    edgeIdSelected.value = newEdge.id
    nodeIdSelected.value = null
  })

  mcdStore.flowMCD.onNodeClick(async (e) => {
    if (activeTab.value === 'default') {
      // Intercept clicks during ternary selection mode
      const handled = await handleTernaryNodeClick(e.node.id)
      if (handled) return

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


  isFlowReady.value = true

  await nextTick(() => {
    mcdStore.flowMCD.fitView({ padding: 0.4 })
  })

  await nextTick(); // Ensure DOM is updated and .dndflow exists
  collaborationStore.setupCursorTracking();
})

// ─── Keyboard shortcuts for Undo/Redo ───
const handleUndoRedoKeydown = (e) => {
  // Only handle in default (MCD) tab
  if (activeTab.value !== 'default') return
  // Skip if user is typing in an input/textarea
  const tag = e.target?.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return

  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    collaborationStore.undo()
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    collaborationStore.redo()
  }
}
window.addEventListener('keydown', handleUndoRedoKeydown)

onUnmounted(() => {
  window.removeEventListener('keydown', handleUndoRedoKeydown)
  activeTab.value = 'default'
  isSubMenuVisible.value = false
  nodeIdSelected.value = null
  edgeIdSelected.value = null
  elementsMenu.value = false
  collaborationStore.cleanup()
  
  isFlowReady.value = false

  if (mcdStore.flowMCD) {
    mcdStore.flowMCD.setNodes([])
    mcdStore.flowMCD.setEdges([])
  }
  if (mcdGenStore.flowMCDGen) {
    mcdGenStore.flowMCDGen.setNodes([])
    mcdGenStore.flowMCDGen.setEdges([])
  }
  if (mldStore.flowMLD) {
    mldStore.flowMLD.setNodes([])
    mldStore.flowMLD.setEdges([])
  }
  if (mpdStore.flowMPD) {
    mpdStore.flowMPD.setNodes([])
    mpdStore.flowMPD.setEdges([])
  }
})

// Edges already handled by onNodesDelete - prevents double Yjs transactions
const _pendingNodeDeleteEdges = new Set()

const onNodesDelete = (deletedNodes) => {
  if (activeTab.value !== 'default') return
  // Skip delete events triggered by undo/redo or Yjs observer - state is handled there
  if (collaborationStore.isUndoRedoing || collaborationStore.isSuppressed()) return
  const deletedNodeIds = deletedNodes.map((n) => n.id)
  const connectedEdgeIds = mcdFlowInstance.getEdges.value
    .filter((e) => deletedNodeIds.includes(e.source) || deletedNodeIds.includes(e.target))
    .map((e) => e.id)
  connectedEdgeIds.forEach(id => _pendingNodeDeleteEdges.add(id))
  mcdStore.removeElements(route.params.idModel, deletedNodeIds, connectedEdgeIds)
  nextTick(() => _pendingNodeDeleteEdges.clear())
  isSubMenuVisible.value = false
  nodeIdSelected.value = null
  edgeIdSelected.value = null
}

const onEdgesDelete = (deletedEdges) => {
  if (activeTab.value !== 'default') return
  // Skip delete events triggered by undo/redo or Yjs observer
  if (collaborationStore.isUndoRedoing || collaborationStore.isSuppressed()) return
  const edgeIds = deletedEdges.map((e) => e.id).filter(id => !_pendingNodeDeleteEdges.has(id))
  if (!edgeIds.length) return
  mcdStore.removeElements(route.params.idModel, [], edgeIds)
  isSubMenuVisible.value = false
  nodeIdSelected.value = null
  edgeIdSelected.value = null
}

// Track nodes the user is physically dragging - only these get persisted on drag-end.
// This prevents programmatic position changes (undo/redo, setNodes, observers)
// from creating spurious Yjs 'local' transactions that wipe the redo stack.
const _userDraggingNodes = new Set()

const onChange = async (changes) => {
  if (activeTab.value !== 'default') return
  if (isResolvingCollisions.value) return
  // CRITICAL: skip ALL persistence when VueFlow is being updated from Yjs
  // (undo/redo/remote observers). Any 'local' Yjs transaction here would wipe redo.
  if (collaborationStore.isUndoRedoing || collaborationStore.isSuppressed()) {
    // Log to verify we're actually skipping
    const posChanges = changes.filter(c => c.type === 'position')
    if (posChanges.length) console.log('[onChange] SKIPPED -', posChanges.length, 'position changes, suppress:', collaborationStore.isSuppressed(), 'undoRedoing:', collaborationStore.isUndoRedoing)
    return
  }
  for (const change of changes) {
    if (change.type === 'position' && change.dragging === true) {
      _userDraggingNodes.add(change.id)
    }
    // Only persist when the user PHYSICALLY dropped a node they were dragging.
    // Ignore all programmatic position changes (undo/redo, setNodes, observers).
    if (
      change.type === 'position' &&
      change.dragging === false &&
      _userDraggingNodes.has(change.id) &&
      change.id.startsWith('dndnode')
    ) {
      _userDraggingNodes.delete(change.id)
      const draggedNode = mcdFlowInstance.findNode(change.id)
      if (draggedNode) {
        const allNodes = mcdFlowInstance.getNodes.value || []
        const otherNodes = allNodes.filter(n => n.id !== change.id)
        const estimated = estimateNodeSize(draggedNode)
        const size = {
          width: draggedNode.dimensions?.width || estimated.width,
          height: draggedNode.dimensions?.height || estimated.height,
        }
        const freePos = findFreePosition(draggedNode.position, size, otherNodes, mcdFlowInstance)
        if (freePos.x !== draggedNode.position.x || freePos.y !== draggedNode.position.y) {
          draggedNode.position = freePos
        }
      }
      await mcdStore.updateNodePosition(route.params.idModel, change.id)
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

const saveAllNodePositions = () => {
  const ns = mcdFlowInstance.getNodes.value;
  const es = mcdFlowInstance.getEdges.value;
  if (!ns.length) return;
  $fetch('/api/models/sync', {
    method: 'PUT',
    body: { id: route.params.idModel, nodes: ns, edges: es }
  }).catch(() => {});
};

const goBack = async () => {
  isSubMenuVisible.value = false
  isFlowReady.value = false
  // Save positions in background - don't await to avoid visual flash
  saveAllNodePositions()
  const workspaceId = model.value?.workspaceId || session.value?.session?.activeOrganizationId
  if (workspaceId) {
    await navigateTo(`/app/workspace/${workspaceId}/dashboard`)
  } else {
    router.back()
  }
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

watch(activeTab, async () => {
  isChangingTab.value = true
  isSubMenuVisible.value = false
  nodeIdSelected.value = null
  edgeIdSelected.value = null

  if (activeTab.value === 'default') {
    currentFlow.value = mcdStore.flowMCD;
  }
  if (activeTab.value === 'mcd') {
    const { nodesMCD, edgesMCD } = await mcdGenStore.generateMCD(
      mcdStore.flowMCD.nodes,
      mcdStore.flowMCD.edges
    )
    mcdGenStore.flowMCDGen.setNodes(nodesMCD)
    mcdGenStore.flowMCDGen.setEdges(edgesMCD)
    currentFlow.value = mcdGenStore.flowMCDGen;
  }
  if (activeTab.value === 'mld') {
    const { nodesMLD, edgesMLD } = await mldStore.generateMLD(
      mcdStore.flowMCD.nodes,
      mcdStore.flowMCD.edges
    )
    mldStore.flowMLD.setNodes(nodesMLD)
    mldStore.flowMLD.setEdges(edgesMLD)
    currentFlow.value = mldStore.flowMLD;
  }
  if (activeTab.value === 'mpd') {
    const { nodesMPD, edgesMPD } = await mpdStore.generateMPD(
      mcdStore.flowMCD.nodes,
      mcdStore.flowMCD.edges
    )
    mpdStore.flowMPD.setNodes(nodesMPD)
    mpdStore.flowMPD.setEdges(edgesMPD)
    currentFlow.value = mpdStore.flowMPD;
  }

  await nextTick()
  await nextTick()
  await nextTick()
  currentFlow.value?.fitView?.({ padding: 0.4 })
  isChangingTab.value = false
})



const reorganize = async () => {
  // Close sidebar and clear selection before layout
  isSubMenuVisible.value = false;
  nodeIdSelected.value = null;
  edgeIdSelected.value = null;

  await nextTick()
  await nextTick() // double tick pour garantir le rendu DOM
  const ns = mcdFlowInstance.getNodes.value;
  const es = mcdFlowInstance.getEdges.value;
  if (!ns.length) return;

  const opts = computeElkOptions(ns);
  const result = await getLayoutedElements(ns, es, opts);
  if (!result) return;

  const { nodes: layoutedNodes, edges: layoutedEdges } = result;

  // Force deselect on the plain objects BEFORE applying
  for (const n of layoutedNodes) { n.selected = false; n.dragging = false; }
  for (const e of layoutedEdges) { e.selected = false; }

  // Persist to Yjs (single undo) - runInTransaction also syncs VueFlow
  collaborationStore.runInTransaction(() => {
    collaborationStore.setNodes(layoutedNodes);
    collaborationStore.setEdges(layoutedEdges);
  });

  // Persist to DB via bulk sync (single request instead of N individual updates)
  $fetch('/api/models/sync', {
    method: 'PUT',
    body: { id: route.params.idModel, nodes: layoutedNodes, edges: layoutedEdges }
  }).catch(() => {});

  await nextTick();
  mcdFlowInstance.fitView({ padding: 0.4 });
};


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
    const {nodesMLD, edgesMLD} = mldStore.generateMLD(getMCDModel['nodes'],getMCDModel['edges'])

    const newTitle = getMCDModel?.name?.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_') +
      `_${Date.now()}_${crypto.randomUUID()}`;
    const response = await $fetch('/api/generator/generate-file', {
      method: 'POST',
      body: { title: newTitle, database: database , nodes: nodesMLD, edges: edgesMLD },
    });


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

const exportToJSON = async () => {
  try {
    const getMCDModel = await $fetch("/api/models/read", {
      method: "GET",
      query: {id: route.params.idModel},
    });

    const dataForExport = {
      nodes: getMCDModel.nodes,
      edges: getMCDModel.edges
    };

    const blob = new Blob([JSON.stringify(dataForExport, null, 2)], {type: 'application/json'});
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const newTitle = getMCDModel?.name?.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_') || 'model';
    a.download = `${newTitle}.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Export JSON généré avec succès !');
  } catch (e) {
    toast.error('Une erreur est survenue lors de l\'export JSON.');
  }
}

const importItems = [
  { title: 'Importer un fichier XML' },
  { title: 'Importer un fichier SQL' },
  { title: 'Importer un fichier JSON' },
];

const exportItems = [
  { title: 'Exporter en PNG', action: () => handleExport('png') },
  { title: 'Exporter en JPEG', action: () => handleExport('jpeg') },
  { title: 'Exporter en JSON', action: () => exportToJSON() },
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
