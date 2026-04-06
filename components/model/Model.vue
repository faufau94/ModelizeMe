<template>
  <div class="w-full">
    <ClientOnly>
      <div v-if="isLoadingModels" class="flex justify-center mt-32 items-center">
        <Loader2 :size="30" class="animate-spin"/>
      </div>
      <div v-else>
        <div v-if="isModelsFetched && (models === null || models.length === 0)">
          <div class="flex flex-col items-center justify-center py-24">
            <div class="rounded-full bg-muted p-4 mb-4">
              <PanelTop class="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 class="text-lg font-semibold tracking-tight">Aucun modèle</h3>
            <p class="text-muted-foreground text-sm max-w-sm mx-auto text-center mt-1">Vous n'avez encore pas créé de modèles. Commencez par en ajouter un pour structurer vos données.</p>
            <div class="pt-4">
              <CreateModelDialog/>
            </div>
          </div>
        </div>
        <div v-else>
          <div class="flex items-center justify-between mb-5">
            <div class="relative w-full max-w-sm">
              <Input v-model="searchTerm" id="search" type="text" placeholder="Rechercher un modèle..." class="bg-white dark:bg-card pl-10"/>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
                <SearchIcon class="size-4 text-muted-foreground"/>
              </span>
            </div>
            <div class="flex items-center gap-2">
              <Button
                @click="toggleSelectionMode"
                :variant="selectionMode ? 'default' : 'outline'"
                class="gap-2"
              >
                <CheckSquare class="w-4 h-4" />
                {{ selectionMode ? 'Annuler' : 'Sélectionner' }}
              </Button>
              <CreateModelDialog/>
            </div>
          </div>

          <!-- Selection mode toolbar -->
          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="-translate-y-2 opacity-0"
            enter-to-class="translate-y-0 opacity-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="translate-y-0 opacity-100"
            leave-to-class="-translate-y-2 opacity-0"
          >
            <div v-if="selectionMode" class="flex items-center justify-between mb-4 px-3 py-2 bg-muted/50 border rounded-lg">
              <div class="flex items-center gap-3">
                <Checkbox
                  :checked="isAllSelected"
                  :indeterminate="isPartiallySelected"
                  @update:checked="handleSelectAllToggle"
                />
                <span class="text-sm text-muted-foreground">
                  <template v-if="selectedModels.length === 0">Sélectionnez des modèles</template>
                  <template v-else>{{ selectedModels.length }} sur {{ filteredModels?.length }} sélectionné(s)</template>
                </span>
              </div>
              <span class="text-xs text-muted-foreground">Cliquez sur les cartes pour les sélectionner</span>
            </div>
          </Transition>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardModel
              v-for="model in filteredModels"
              :key="model.id"
              :model="model"
              :viewers="modelViewers[model.id] || []"
              :is-selected="selectedModels.includes(model.id)"
              :selection-mode="selectionMode"
              @toggle-select="toggleSelection"
            />
          </div>
        </div>
      </div>
    </ClientOnly>

    <!-- Floating bulk action bar -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div v-if="selectionMode && selectedModels.length > 0" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div class="flex items-center gap-1 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 px-4 py-2.5 rounded-xl shadow-2xl border border-zinc-700 dark:border-zinc-300">
          <span class="text-sm font-medium px-2 tabular-nums">{{ selectedModels.length }} sélectionné(s)</span>
          <div class="w-px h-5 bg-zinc-600 dark:bg-zinc-400 mx-1"></div>
          
          <!-- Move / Copy dropdown -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm" :disabled="isBulkActionLoading" class="text-zinc-100 dark:text-zinc-900 hover:text-white dark:hover:text-black hover:bg-zinc-700 dark:hover:bg-zinc-300 h-8 gap-1.5 text-xs">
                <ArrowRightToLine class="w-3.5 h-3.5" />
                Déplacer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" :side-offset="12" class="w-[220px]">
              <!-- Teams section (move within workspace) -->
              <DropdownMenuLabel class="text-xs text-muted-foreground">Déplacer vers une équipe</DropdownMenuLabel>
              <DropdownMenuGroup>
                <template v-if="availableTeams.length">
                  <DropdownMenuItem
                    v-for="team in availableTeams"
                    :key="team.id"
                    class="cursor-pointer"
                    @click="handleBulkMove(team.id, team.name)"
                  >
                    <Users class="mr-2 h-4 w-4 text-muted-foreground" />
                    {{ team.name }}
                  </DropdownMenuItem>
                </template>
                <DropdownMenuItem v-else disabled class="text-muted-foreground text-xs italic">
                  Aucune équipe disponible
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <!-- Remove from team (only on team page) -->
              <template v-if="isTeamPage">
                <DropdownMenuSeparator />
                <DropdownMenuItem class="cursor-pointer" @click="handleBulkMove(null, null)">
                  <X class="mr-2 h-4 w-4 text-muted-foreground" />
                  Retirer de l'équipe
                </DropdownMenuItem>
              </template>

              <DropdownMenuSeparator />

              <!-- Workspaces section (copy) -->
              <DropdownMenuLabel class="text-xs text-muted-foreground">Copier vers un workspace</DropdownMenuLabel>
              <DropdownMenuGroup>
                <template v-if="otherWorkspaces.length">
                  <DropdownMenuItem
                    v-for="ws in otherWorkspaces"
                    :key="ws.id"
                    class="cursor-pointer"
                    @click="handleBulkCopy(ws.id, ws.name)"
                  >
                    <ExternalLink class="mr-2 h-4 w-4 text-muted-foreground" />
                    {{ ws.name }}
                  </DropdownMenuItem>
                </template>
                <DropdownMenuItem v-else disabled class="text-muted-foreground text-xs italic">
                  Aucun autre workspace
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div class="w-px h-5 bg-zinc-600 dark:bg-zinc-400 mx-1"></div>

          <Button @click="showBulkDeleteDialog = true" variant="ghost" size="sm" :disabled="isBulkActionLoading" class="text-red-400 hover:text-red-200 dark:text-red-600 dark:hover:text-red-800 hover:bg-red-500/20 dark:hover:bg-red-500/20 h-8 gap-1.5 text-xs">
            <Trash2 class="w-3.5 h-3.5" />
            Supprimer
          </Button>

          <div class="w-px h-5 bg-zinc-600 dark:bg-zinc-400 mx-1"></div>

          <Button @click="exitSelectionMode" variant="ghost" size="icon" class="text-zinc-400 dark:text-zinc-600 hover:text-white dark:hover:text-black hover:bg-zinc-700 dark:hover:bg-zinc-300 h-8 w-8">
            <X class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Transition>

    <!-- Bulk delete confirmation dialog -->
    <AlertDialog :open="showBulkDeleteDialog" @update:open="showBulkDeleteDialog = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer {{ selectedModels.length }} modèle(s) ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible et supprimera définitivement les modèles sélectionnés ainsi que toutes leurs données.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="showBulkDeleteDialog = false">Annuler</AlertDialogCancel>
          <Button variant="destructive" @click="handleBulkDelete" :disabled="isDeleting">
            <Loader2 v-if="isDeleting" class="w-4 h-4 mr-2 animate-spin"/>
            {{ isDeleting ? 'Suppression...' : 'Supprimer' }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup>
import {computed, ref, watch, onMounted, onUnmounted} from 'vue';
import { Search as SearchIcon, Loader2, Trash2, X, PanelTop, CheckSquare, ArrowRightToLine, Users, ExternalLink } from 'lucide-vue-next'
import CardModel from "@/components/ui/card/CardModel.vue";
import {toast} from "vue-sonner";

import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog, AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import CreateModelDialog from "@/components/flow/CreateModelDialog.vue";
import { useModel } from "@/composables/api/useModel"
import { useWorkspace } from "@/composables/api/useWorkspace"

const { models, isLoadingModels, isModelsFetched, bulkDeleteModels, bulkMoveModels, bulkCopyModels } = useModel()
const { selectedWorkspace, workspaces, selectedWorkspaceId } = useWorkspace()

const route = useRoute()
const isTeamPage = computed(() => !!route.params.teamId)
const currentTeamId = computed(() => route.params.teamId || null)

const searchTerm = ref("");
const selectionMode = ref(false);
const selectedModels = ref([]);
const modelViewers = ref({})
const showBulkDeleteDialog = ref(false)
let viewerPollTimer = null

const fetchViewers = async () => {
  if (!models.value?.length) return
  const ids = models.value.map(m => m.id).join(',')
  try {
    modelViewers.value = await $fetch('/api/models/viewers', { query: { modelIds: ids } })
  } catch (e) {
    // Silently fail
  }
}

// Poll viewers every 15 seconds
onMounted(() => {
  fetchViewers()
  viewerPollTimer = setInterval(fetchViewers, 15_000)
})

onUnmounted(() => {
  if (viewerPollTimer) clearInterval(viewerPollTimer)
})

// Refresh viewers when models change
watch(models, () => fetchViewers(), { deep: false })

const isDeleting = ref(false);
const isBulkActionLoading = computed(() => isDeleting.value)

const availableTeams = computed(() => {
  const teams = selectedWorkspace.value?.teams || []
  // Exclude current team if we're on a team page
  if (currentTeamId.value) {
    return teams.filter((t) => t.id !== currentTeamId.value)
  }
  return teams
})

const otherWorkspaces = computed(() =>
  workspaces.value?.filter((ws) => ws.id !== selectedWorkspaceId.value) || []
)

const filteredModels = computed(() => {
  if (searchTerm.value === "") return models?.value
  return models?.value?.filter((card) =>
      card.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
});

const isAllSelected = computed(() =>
  filteredModels.value?.length > 0 && selectedModels.value.length === filteredModels.value.length
)

const isPartiallySelected = computed(() =>
  selectedModels.value.length > 0 && !isAllSelected.value
)

const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value
  if (!selectionMode.value) {
    selectedModels.value = []
  }
}

const exitSelectionMode = () => {
  selectionMode.value = false
  selectedModels.value = []
}

const toggleSelection = (modelId) => {
  const index = selectedModels.value.indexOf(modelId);
  if (index > -1) {
    selectedModels.value.splice(index, 1);
  } else {
    selectedModels.value.push(modelId);
  }
};

const handleSelectAllToggle = (checked) => {
  if (checked) {
    selectedModels.value = filteredModels.value.map(m => m.id)
  } else {
    selectedModels.value = []
  }
};

const handleBulkDelete = async () => {
  if (selectedModels.value.length === 0) return;
  
  try {
    isDeleting.value = true;
    await bulkDeleteModels(selectedModels.value);
    toast.success(`${selectedModels.value.length} modèle(s) supprimé(s)`);
    selectedModels.value = [];
    showBulkDeleteDialog.value = false;
  } catch (err) {
    toast.error('Erreur lors de la suppression');
  } finally {
    isDeleting.value = false;
  }
};

const handleBulkMove = async (teamId, teamName) => {
  if (selectedModels.value.length === 0) return;

  try {
    await bulkMoveModels(selectedModels.value, teamId);
    if (teamId) {
      toast.success(`${selectedModels.value.length} modèle(s) déplacé(s) vers ${teamName}`);
    } else {
      toast.success(`${selectedModels.value.length} modèle(s) retiré(s) de l'équipe`);
    }
    exitSelectionMode();
  } catch (err) {
    toast.error('Erreur lors du déplacement');
  }
};

const handleBulkCopy = async (targetWorkspaceId, workspaceName) => {
  if (selectedModels.value.length === 0) return;

  try {
    await bulkCopyModels(selectedModels.value, targetWorkspaceId);
    toast.success(`${selectedModels.value.length} modèle(s) copié(s) vers ${workspaceName}`);
    exitSelectionMode();
  } catch (err) {
    toast.error('Erreur lors de la copie');
  }
};


</script>