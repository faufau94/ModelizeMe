<template>
  <div class="w-full max-w-6xl mx-auto px-4 py-8">
    <ClientOnly>
      <div v-if="isLoadingModels" class="flex justify-center mt-32 items-center">
        <Loader2 :size="30" class="animate-spin"/>
      </div>
      <div v-else>
        <div v-if="isModelsFetched && (models === null || models.length === 0)">
          <div class="flex flex-col items-center justify-center h-[80vh]">
            <div class="text-center space-y-4">
              <h3 class="text-2xl font-bold tracking-tight">Aucun modèle</h3>
              <p class="text-muted-foreground text-sm max-w-sm mx-auto">Vous n'avez encore pas créé de modèles. Commencez par en ajouter un pour structurer vos données.</p>
               <div class="pt-2">
                 <CreateModelDialog/>
               </div>
            </div>
          </div>
        </div>
        <div v-else>
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-2xl font-bold tracking-tight">Modèles</h1>
              <p class="text-sm text-muted-foreground mt-1">{{ models?.length }} modèle(s) dans ce workspace</p>
            </div>
            <div class="flex items-center gap-2">
              <Button 
                @click="selectionMode = !selectionMode; if (!selectionMode) clearSelection()"
                :variant="selectionMode ? 'secondary' : 'outline'" 
                size="sm" 
                class="gap-2"
              >
                <CheckSquareIcon class="w-4 h-4" />
                {{ selectionMode ? 'Annuler' : 'Sélectionner' }}
              </Button>
              <CreateModelDialog/>
            </div>
          </div>
          <div class="mb-6">
            <div class="relative w-full max-w-sm">
              <Input v-model="searchTerm" id="search" type="text" placeholder="Rechercher un modèle..." class="pl-10 bg-white"/>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
                <SearchIcon class="size-4 text-muted-foreground"/>
              </span>
            </div>
          </div>
          
          <div v-if="isLoadingModels" class="flex justify-center mt-32 items-center">
            <Loader2 :size="30" class="animate-spin"/>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardModel 
              v-for="model in filteredModels" 
              :key="model.id" 
              :model="model"
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
      <div v-if="selectedModels.length > 0" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div class="flex items-center gap-4 bg-foreground text-background px-5 py-3 rounded-lg shadow-lg">
          <span class="text-sm font-medium">{{ selectedModels.length }} sélectionné(s)</span>
          <div class="w-px h-5 bg-background/20"></div>
          <Button @click="handleBulkDelete" variant="ghost" size="sm" :disabled="isDeleting" class="text-background hover:text-background hover:bg-background/10 h-8 gap-2">
            <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin"/>
            <Trash2 v-else class="w-4 h-4" />
            Supprimer
          </Button>
          <Button @click="clearSelection" variant="ghost" size="sm" class="text-background/70 hover:text-background hover:bg-background/10 h-8">
            <X class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue';
import { Search as SearchIcon, Loader2, Trash2, X, CheckSquare as CheckSquareIcon } from 'lucide-vue-next'
import CardModel from "@/components/ui/card/CardModel.vue";
import {toast} from "vue-sonner";

import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import CreateModelDialog from "@/components/flow/CreateModelDialog.vue";
import { useModel } from "@/composables/api/useModel"

const { models, isLoadingModels, isModelsFetched, bulkDeleteModels } = useModel()

const searchTerm = ref("");
const selectedModels = ref([]);
const isDeleting = ref(false);
const selectionMode = ref(false);

const filteredModels = computed(() => {
  if (searchTerm.value === "") return models?.value
  return models?.value?.filter((card) =>
      card.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
});

const toggleSelection = (modelId) => {
  const index = selectedModels.value.indexOf(modelId);
  if (index > -1) {
    selectedModels.value.splice(index, 1);
  } else {
    selectedModels.value.push(modelId);
  }
};

const clearSelection = () => {
  selectedModels.value = [];
};

const handleBulkDelete = async () => {
  if (selectedModels.value.length === 0) return;
  
  try {
    isDeleting.value = true;
    await bulkDeleteModels(selectedModels.value);
    toast.success(`${selectedModels.value.length} modèle(s) supprimé(s)`);
    clearSelection();
  } catch (err) {
    toast.error('Erreur lors de la suppression');
  } finally {
    isDeleting.value = false;
  }
};

</script>