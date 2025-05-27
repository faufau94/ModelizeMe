<template>
  <div class="w-full max-w-6xl mx-auto px-4 py-8">
    <div v-if="isLoadingModels" class="flex justify-center mt-32 items-center">
      <Loader2 :size="30" class="animate-spin"/>
    </div>
    <div v-else>
      <div v-if="isModelsFetched && (models === null || models.length === 0)">
        <div class="flex flex-col items-center justify-center h-[80vh]">
          <div class="text-center space-y-4">
            <h3 class="text-2xl font-bold">Aucun modèle</h3>
            <p class="text-muted-foreground">Vous n'avez encore pas créé de modèles.</p>
             <CreateModelDialog/>
          </div>
        </div>
      </div>
      <div v-else>
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold">Modèles</h1>
          <CreateModelDialog/>
        </div>
        <div class="mb-6">
          <div class="relative w-full max-w-sm items-center">
            <Input v-model="searchTerm" id="search" type="text" placeholder="Rechercher un modèle" class="pl-10"/>
            <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
      <Search class="size-5 text-muted-foreground"/>
    </span>
          </div>
        </div>
        <div v-if="isLoadingModels" class="flex justify-center mt-32 items-center">
          <Loader2 :size="30" class="animate-spin"/>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardModel v-for="model in filteredModels" :key="model.id" :model="model"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue';
import {Search, Loader2} from 'lucide-vue-next';
import CardModel from "@/components/ui/card/CardModel.vue";

import {Input} from '@/components/ui/input'
import {useMCDStore} from "@/stores/mcd-store.js";
import {storeToRefs} from "pinia";
import CreateModelDialog from "@/components/flow/CreateModelDialog.vue";
import { useModel } from "@/composables/api/useModel"


const { models, isLoadingModels, isModelsFetched } = useModel()


const searchTerm = ref("");

const filteredModels = computed(() => {
  if (searchTerm.value === "") return models?.value
  return models?.value?.filter((card) =>
      card.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
});


</script>