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
        :min-zoom="0.1"
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
      <Controls :fit-view-params="{ padding: 0.1, includeHiddenNodes: false, minZoom: 0.1 }"/>

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
      <Panel position="top-left" class="bg-white/95 dark:bg-card/95 backdrop-blur-sm z-40 px-2 md:px-3 py-1.5 shadow-md flex items-center rounded-lg space-x-0.5 md:space-x-1 border border-gray-100 dark:border-border max-w-[calc(100vw-1rem)] md:max-w-none overflow-x-auto">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button @click="goBack" variant="ghost" size="sm" class="rounded-md hover:bg-accent flex-shrink-0">
                <ArrowLeft :size="18"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-gray-900 text-white text-xs">
              <p>Retour au tableau de bord</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" class="h-5 bg-border flex-shrink-0"/>

        <Dialog v-model:open="showDialogRenameModel">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <DialogTrigger as-child>
                  <Button @click="setValues({name: model.name})" variant="ghost" size="sm" class="rounded-md font-medium text-foreground hover:bg-accent min-w-[60px] md:min-w-[100px] max-w-[80px] md:max-w-[120px] overflow-hidden flex-shrink-0">
                    <span class="truncate block text-xs md:text-sm">{{ model?.name }}</span>
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

        <Separator orientation="vertical" class="h-5 bg-border flex-shrink-0"/>

        <!-- Hidden on mobile to save space, visible on md+ -->
        <div class="hidden md:flex items-center space-x-0.5">
          <!-- <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <CreateGaleryTemplate />
              </TooltipTrigger>
              <TooltipContent class="bg-gray-900 text-white text-xs">
                <p>Sauvegarder comme template</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider> -->

          <Dialog v-model:open="isImportDialogOpen">
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="sm" class="rounded-md">
                        <EllipsisVertical :size="16"/>
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent class="bg-gray-900 text-white text-xs">
                    <p>Plus d'options</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent class="w-56" align="start">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator/>

                <DropdownMenuItem class="cursor-pointer" @click="navigateTo({ path: `/app/workspace/${model?.workspaceId}/generator/new`, query: { modelId: route.params.idModel } })">
                  <FolderCode :size="16" class="mr-2"/>
                  Générer le projet...
                </DropdownMenuItem>

                <DropdownMenuSeparator/>

                <DialogTrigger as-child>
                  <DropdownMenuItem class="cursor-pointer">
                    <Upload :size="16" class="mr-2"/>
                    Importer...
                  </DropdownMenuItem>
                </DialogTrigger>

                <DropdownMenuSub v-if="exportItems && exportItems.length > 0">
                  <DropdownMenuSubTrigger class="cursor-pointer">
                    <Download :size="16" class="mr-2"/>
                    <span>Exporter en</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent class="min-w-[160px]">
                      <template v-for="(item, index) in exportItems" :key="index">
                        <DropdownMenuSeparator v-if="item.type === 'separator'" />
                        <DropdownMenuLabel v-else-if="item.type === 'label'" class="text-xs text-muted-foreground font-normal px-2 py-1">
                          {{ item.title }}
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          v-else
                          class="cursor-pointer"
                          @click="item.action"
                          :disabled="item.disabled"
                        >
                          <span>{{ item.title }}</span>
                        </DropdownMenuItem>
                      </template>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSeparator/>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger class="cursor-pointer">
                    <Workflow :size="16" class="mr-2"/>
                    <span>Style des connecteurs</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent class="p-1">
                      <DropdownMenuItem
                        v-for="opt in edgeStyleOptions" :key="opt.value"
                        class="cursor-pointer"
                        :class="edgePathStyle === opt.value ? 'bg-primary/10 text-primary font-medium' : ''"
                        @click="edgePathStyle = opt.value"
                      >
                        <svg width="24" height="12" viewBox="0 0 24 12" class="flex-shrink-0 mr-2">
                          <path :d="opt.preview" fill="none" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        {{ opt.label }}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropFile menu-item="Importer un fichier" @toggle-dialog="isImportDialogOpen = !isImportDialogOpen" />
          </Dialog>
        </div>

        <!-- Mobile-only: 3-dots menu -->
        <div class="flex md:hidden items-center space-x-0.5 flex-shrink-0">
          <Dialog v-model:open="isImportDialogOpen">
            <DropdownMenu dir="ltr">
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="sm" class="rounded-md h-8 w-8 p-0">
                  <EllipsisVertical :size="14"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-56" align="start">
                <DropdownMenuItem class="cursor-pointer" @click="navigateTo({ path: `/app/workspace/${model?.workspaceId}/generator/new`, query: { modelId: route.params.idModel } })">
                  <FolderCode :size="16" class="mr-2"/>
                  Générer le projet...
                </DropdownMenuItem>
                <DropdownMenuSeparator/>

                <DialogTrigger as-child>
                  <DropdownMenuItem class="cursor-pointer">
                    <Upload :size="16" class="mr-2"/>
                    Importer...
                  </DropdownMenuItem>
                </DialogTrigger>

                <DropdownMenuSub v-if="exportItems && exportItems.length > 0">
                  <DropdownMenuSubTrigger class="cursor-pointer">
                    <Download :size="16" class="mr-2"/>
                    <span>Exporter en</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent class="min-w-[160px]">
                      <template v-for="(item, index) in exportItems" :key="index">
                        <DropdownMenuSeparator v-if="item.type === 'separator'" />
                        <DropdownMenuLabel v-else-if="item.type === 'label'" class="text-xs text-muted-foreground font-normal px-2 py-1">
                          {{ item.title }}
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          v-else
                          class="cursor-pointer"
                          @click="item.action"
                          :disabled="item.disabled"
                        >
                          <span>{{ item.title }}</span>
                        </DropdownMenuItem>
                      </template>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator/>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger class="cursor-pointer">
                    <Workflow :size="16" class="mr-2"/>
                    <span>Style des connecteurs</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent class="p-1">
                      <DropdownMenuItem
                        v-for="opt in edgeStyleOptions" :key="opt.value"
                        class="cursor-pointer"
                        :class="edgePathStyle === opt.value ? 'bg-primary/10 text-primary font-medium' : ''"
                        @click="edgePathStyle = opt.value"
                      >
                        <svg width="24" height="12" viewBox="0 0 24 12" class="flex-shrink-0 mr-2">
                          <path :d="opt.preview" fill="none" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        {{ opt.label }}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropFile menu-item="Importer un fichier" @toggle-dialog="isImportDialogOpen = !isImportDialogOpen" />
          </Dialog>
        </div>

        <PricingDialog />
      </Panel>

      <!-- Center toolbar: MCD actions + save status -->
      <Panel v-if="activeTab === 'default'" position="top-center"
             class="bg-white/95 dark:bg-card/95 backdrop-blur-sm z-40 px-2 md:px-3 py-1.5 shadow-md flex items-center rounded-lg space-x-0.5 md:space-x-1 border border-gray-100 dark:border-border max-w-[calc(100vw-1rem)] md:max-w-none">

        <div v-if="addNewNode" class="flex items-center gap-2 px-2 text-amber-600 transition-all duration-200">
          <Loader2 :size="16" class="animate-spin"/>
          <span class="text-xs font-medium">Enregistrement...</span>
        </div>
        <div v-else class="flex items-center gap-2 px-2 text-green-600 transition-all duration-200">
          <Check :size="16"/>
          <span class="text-xs font-medium">Sauvegardé</span>
        </div>

        <Separator orientation="vertical" class="h-5 bg-border"/>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                  @click="addNode(route.params.idModel)"
                  :draggable="true"
                  @dragstart="onDragStart($event, 'input')"
                  variant="ghost"
                  size="sm"
                  class="group rounded-md hover:bg-accent hover:text-blue-600"
              >
                  <span class="relative">
                    <PanelTop :size="16"/>
                    <Plus class="absolute -bottom-0.5 -right-0.5 bg-background text-foreground group-hover:text-blue-600 rounded-full" style="width: 10px; height: 10px; stroke-width: 3; padding: 1.5px;"/>
                  </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-gray-900 text-white text-xs">
              <p>Ajouter une entité</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" class="h-5 bg-border"/>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                  variant="ghost"
                  :disabled="!canUndo"
                  size="sm"
                  class="rounded-md"
                  @click="undoRedoStore.undo(route.params.idModel, mcdStore.emitEvent)"
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
                  @click="undoRedoStore.redo(route.params.idModel, mcdStore.emitEvent)"
              >
                <Redo2 :size="16"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-gray-900 text-white text-xs">
              <p>Rétablir</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" class="h-5 bg-border"/>

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

        <Separator orientation="vertical" class="h-5 bg-border"/>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                  variant="ghost"
                  size="sm"
                  class="rounded-md"
                  @click="currentFlow?.fitView({ padding: 0.1, minZoom: 0.1 })"
              >
                <Maximize2 :size="16"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent class="bg-gray-900 text-white text-xs">
              <p>Ajuster la vue</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" class="h-5 bg-border"/>

        <div class="pl-1 hidden sm:block">
          <ActiveUsersAvatars :activeUsers="activeUsers" :maxVisible="3" />
        </div>

      </Panel>

      <!-- Tab switcher: MCD / MLD / MPD -->
      <Panel position="top-right" class="bg-white/95 dark:bg-card/95 backdrop-blur-sm mr-1 md:mr-10 z-40 shadow-md flex items-center rounded-lg border border-gray-100 dark:border-border">
        <Tabs default-value="default" v-model="activeTab" class="w-full">
          <TabsList class="grid grid-cols-4 text-xs md:text-sm">

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
import {ArrowLeft, Check, Download, EllipsisVertical, FolderCode, Loader2, PanelTop, Plus, Redo2, Undo2, Upload, WandSparkles, Workflow, Maximize2} from "lucide-vue-next";
import {Separator} from '@/components/ui/separator'
import PricingDialog from "@/components/PricingDialog.vue";
import {Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,} from '@/components/ui/dialog'
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {useCollaborationStore} from '~/stores/collaboration-store.js';
import {useUndoRedoStore} from '~/stores/undo-redo-store.js';

import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'
import {computeElkOptions, getLayoutedElements, estimateNodeSize} from '@/utils/useElk.js';
import {findFreePosition, resolveCollisions} from '@/utils/useCollisions.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu'
import DropFile from "@/components/flow/DropFile.vue";

import {toTypedSchema} from "@vee-validate/zod";
import {z} from "zod/v4";
import {useForm} from 'vee-validate'
import CreateGaleryTemplate from "@/components/flow/CreateGaleryTemplate.vue";

import {useModel} from '@/composables/api/useModel'
import {authClient} from '~/lib/auth-client'
import ActiveUsersAvatars from '@/components/ActiveUsersAvatars.vue'
import { useExport } from '@/composables/useExport';
import {toast} from "vue-sonner";

const route = useRoute()
const router = useRouter()

const model = ref(null)

const mcdStore = useMCDStore()
const mcdGenStore = useMCDGenStore()
const mldStore = useMLDStore()
const mpdStore = useMPDStore()
const {addNode} = mcdStore
const {isSubMenuVisible, nodeIdSelected, edgeIdSelected, elementsMenu, addNewNode, activeTab, edgeType, isResolvingCollisions, isTernaryMode, ternarySelectedNodes, edgePathStyle, isConnecting, connectingSourceNodeId, connectHoveredNodeId} = storeToRefs(mcdStore)

const edgeStyleOptions = [
  { value: 'smoothstep', label: 'Angle droit', preview: 'M 0 10 L 12 10 L 12 2 L 24 2' },
  { value: 'smoothstepSharp', label: 'Angle droit (net)', preview: 'M 0 10 L 12 10 L 12 2 L 24 2' },
  { value: 'bezier', label: 'Courbe', preview: 'M 0 10 C 8 0, 16 0, 24 10' },
  { value: 'simpleBezier', label: 'Courbe douce', preview: 'M 0 10 Q 12 0 24 10' },
  { value: 'straight', label: 'Droit', preview: 'M 0 6 L 24 6' },
]

const isImportDialogOpen = ref(false)

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

const { activeUsers, remoteCursors } = storeToRefs(collaborationStore)
const undoRedoStore = useUndoRedoStore()
const { canUndo, canRedo } = storeToRefs(undoRedoStore)


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
  nodeIdSelected.value = null
  edgeIdSelected.value = null
  isSubMenuVisible.value = false
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
      return navigateTo(`/app/workspace/${session.value?.session?.activeOrganizationId}`)
    }
    toast.error("Une erreur est survenue lors du chargement du modèle.")
    return navigateTo(`/app/workspace/${session.value?.session?.activeOrganizationId}`)
  }

  // Set initial nodes/edges in Yjs AND VueFlow.
  // Use skipTracking=true (origin='init') so UndoManager ignores the initial load.
  // Future edits will be tracked as deltas from this base state.
  // Strip stale selected/dragging state from DB data
  const initialNodes = (model.value?.nodes || []).map(n => {
    const { selected, dragging, ...rest } = n
    // Ternary nodes must never be draggable (same behavior as association tables)
    if (rest.type === 'ternaryEntity') rest.draggable = false
    return rest
  });
  const initialEdges = (model.value?.edges || []).map(e => {
    const { selected, ...rest } = e
    return rest
  });
  collaborationStore.setNodes(initialNodes, true);
  collaborationStore.setEdges(initialEdges, true);
  undoRedoStore.clear();
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
    isConnecting.value = true
    connectingSourceNodeId.value = nodeId
  })

  mcdStore.flowMCD.onConnectEnd((event) => {
    isConnecting.value = false
    connectingSourceNodeId.value = null
    connectHoveredNodeId.value = null
    if (!_connectStartParams.value) return
    const startParams = _connectStartParams.value
    _connectStartParams.value = null

    const targetEl = event?.target
    if (!targetEl) return

    // Check if dropped on a node (or inside a node)
    const nodeEl = targetEl.closest('.vue-flow__node')
    if (nodeEl) {
      // Extract the node id from the data attribute
      const targetNodeId = nodeEl.getAttribute('data-id')
      if (targetNodeId && targetNodeId !== startParams.nodeId) {
        // Auto-connect to the target node (handles will be determined by floating edge logic)
        mcdStore.addEdge(route.params.idModel, {
          source: startParams.nodeId,
          target: targetNodeId,
          sourceHandle: startParams.handleId,
          targetHandle: null,
        })
        return
      }
    }

    // Only act when the edge was dropped on the empty pane (not on a valid handle)
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
    isConnecting.value = false
    connectingSourceNodeId.value = null
    connectHoveredNodeId.value = null
    // Prevent self-loops via drag & drop — use the ElementMenu instead
    if (params.source === params.target) return
    mcdStore.addEdge(route.params.idModel, params)
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

  mcdStore.flowMCD.onNodesInitialized(() => {
    mcdStore.flowMCD.fitView({ padding: 0.1, minZoom: 0.1 })
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
    undoRedoStore.undo(route.params.idModel, mcdStore.emitEvent)
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    undoRedoStore.redo(route.params.idModel, mcdStore.emitEvent)
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
  const edgeIds = deletedEdges.map((e) => e.id).filter(id => !_pendingNodeDeleteEdges.has(id))
  if (!edgeIds.length) return
  mcdStore.removeElements(route.params.idModel, [], edgeIds)
  isSubMenuVisible.value = false
  nodeIdSelected.value = null
  edgeIdSelected.value = null
}

// Track nodes the user is physically dragging + their original position before drag.
// Only these get persisted on drag-end. Captures original position for undo inverse.
const _userDraggingNodes = new Map() // nodeId → { x, y } (position before drag)

const onChange = async (changes) => {
  if (activeTab.value !== 'default') return
  if (isResolvingCollisions.value) return
  for (const change of changes) {
    if (change.type === 'position' && change.dragging === true) {
      // Capture original position on drag-start (only first time)
      if (!_userDraggingNodes.has(change.id)) {
        const node = mcdFlowInstance.findNode(change.id)
        if (node) {
          _userDraggingNodes.set(change.id, { x: node.position.x, y: node.position.y })
        }
      }
    }
    // Only persist when the user PHYSICALLY dropped a node they were dragging.
    if (
      change.type === 'position' &&
      change.dragging === false &&
      _userDraggingNodes.has(change.id) &&
      change.id.startsWith('dndnode')
    ) {
      const originalPos = _userDraggingNodes.get(change.id)
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
      await mcdStore.updateNodePosition(route.params.idModel, change.id, originalPos)
    }
  }
}

const onEdgeUpdate = async ({edge, connection}) => {
  const prevEdgeData = JSON.parse(JSON.stringify(edge.data || {}))
  mcdStore.flowMCD.updateEdge(edge, connection, false)
  await mcdStore.updateEdge(route.params.idModel, edge.id, prevEdgeData)
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
  if (!ns.length) return;
  const positions = ns.map(n => ({ id: n.id, x: n.position.x, y: n.position.y }))
  mcdStore.emitEvent(route.params.idModel, [{
    type: 'BATCH_POSITIONS',
    payload: { positions },
    inverse: null,
    undoable: false
  }]).catch(() => {});
};

const goBack = async () => {
  // Deselect everything before leaving
  nodeIdSelected.value = null
  edgeIdSelected.value = null
  isSubMenuVisible.value = false
  isFlowReady.value = false
  // Save positions in background - don't await to avoid visual flash
  saveAllNodePositions()
  const workspaceId = model.value?.workspaceId || session.value?.session?.activeOrganizationId
  if (workspaceId) {
    await navigateTo(`/app/workspace/${workspaceId}`)
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

const { exportItems } = useExport(currentFlow, model)

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
    const { nodesMLD, edgesMLD } = await mldStore.generateMLD(
      mcdStore.flowMCD.nodes,
      mcdStore.flowMCD.edges
    )
    const { nodesMPD, edgesMPD } = await mpdStore.generateMPD(nodesMLD, edgesMLD)
    mpdStore.flowMPD.setNodes(nodesMPD)
    mpdStore.flowMPD.setEdges(edgesMPD)
    currentFlow.value = mpdStore.flowMPD;
  }

  await nextTick()
  currentFlow.value?.onNodesInitialized(() => {
    currentFlow.value?.fitView?.({ padding: 0.1, minZoom: 0.1 })
  })
  isChangingTab.value = false
})



const isReorganizing = ref(false);

const reorganize = async () => {
  if (isReorganizing.value) return;
  isReorganizing.value = true;
  try {
    // Close sidebar and clear selection before layout
    isSubMenuVisible.value = false;
    nodeIdSelected.value = null;
    edgeIdSelected.value = null;

    await nextTick()
    await nextTick() // double tick to ensure DOM rendered
    const ns = mcdFlowInstance.getNodes.value;
    const es = mcdFlowInstance.getEdges.value;
    if (!ns.length) return;

    const opts = computeElkOptions(ns, es);
    const result = await getLayoutedElements(ns, es, opts);
    if (!result) return;

    let { nodes: layoutedNodes } = result;

    // Post-layout collision resolution pass using fresh positions + edges
    // (association tables at bezier midpoints, loopback arcs, cardinalities)
    layoutedNodes = resolveCollisions(layoutedNodes, result.edges, {
      margin: 40,
    });

    // Force deselect on the plain objects BEFORE applying
    for (const n of layoutedNodes) { n.selected = false; n.dragging = false; }

    // Emit LAYOUT_APPLIED event with all new positions
    const positions = layoutedNodes.map(n => ({ id: n.id, x: n.position.x, y: n.position.y }))
    await mcdStore.emitEvent(route.params.idModel, [{
      type: 'LAYOUT_APPLIED',
      payload: { positions },
      inverse: null,
      undoable: false
    }])

    await nextTick();
    mcdFlowInstance.fitView({ padding: 0.1, minZoom: 0.1 });
  } finally {
    isReorganizing.value = false;
  }
};


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

/* Responsive panel positioning: stack vertically on mobile */
@media screen and (max-width: 639px) {
  .vue-flow__panel.top-left {
    max-width: 55%;
  }
  .vue-flow__panel.top-center {
    left: auto;
    right: auto;
    transform: none;
    top: 52px;
  }
  .vue-flow__panel.top-right {
    top: 4px;
    right: 4px;
  }
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
