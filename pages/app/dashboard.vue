<template>
  <div class="w-full max-w-6xl mx-auto px-4 py-8">
    <div v-if="areModelsLoaded === true && (models === null || models.length === 0)">
          <div class="flex flex-col items-center justify-center h-[80vh]">
            <div class="text-center space-y-4">
              <h3 class="text-2xl font-bold">Aucun résultat</h3>
              <p class="text-muted-foreground">Vous n'avez encore pas créé de modèles.</p>
              <Dialog>
                <DialogTrigger as-child>
                  <Button @click="showModel = true">
                    <CirclePlus :size="20" class="mr-2"/>
                    Créer un modèle
                  </Button>
                </DialogTrigger>
                <DialogContent class="sm:max-w-[425px]" v-if="showModel">
                  <DialogHeader>
                    <DialogTitle>Nouveau modèle</DialogTitle>
                    <DialogDescription>
                      Ajouter un nouveau modèle.
                    </DialogDescription>
                  </DialogHeader>

                  <Input v-model="newModel.title" type="text"/>

                  <DialogFooter class="mt-3">
                    <DialogClose as-child>
                      <Button @click="showModel = false" type="button" variant="secondary">
                        Fermer
                      </Button>
                    </DialogClose>
                    <Button @click="onSubmit" :disabled="isLoadingNewModel">
                      <Loader2 v-if="isLoadingNewModel" class="w-4 h-4 mr-2 animate-spin"/>
                      {{ isLoadingNewModel ? 'Ajout...' : 'Ajouter' }}
                    </Button>
                  </DialogFooter>

                </DialogContent>
              </Dialog>
            </div>
          </div>
    </div>
    <div v-else>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">Modèles</h1>
        <Toaster/>
        <Dialog>
          <DialogTrigger as-child>
            <Button @click="showModel = true">
              <CirclePlus :size="20" class="mr-2"/>
              Nouveau modèle
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[425px]" v-if="showModel">
            <DialogHeader>
              <DialogTitle>Nouveau modèle</DialogTitle>
              <DialogDescription>
                Ajouter un nouveau modèle.
              </DialogDescription>
            </DialogHeader>

            <Input v-model="newModel.title" type="text"/>

            <DialogFooter class="mt-3">
              <DialogClose as-child>
                <Button @click="showModel = false" type="button" variant="secondary">
                  Fermer
                </Button>
              </DialogClose>
              <Button @click="onSubmit" :disabled="isLoadingNewModel">
                <Loader2 v-if="isLoadingNewModel" class="w-4 h-4 mr-2 animate-spin"/>
                {{ isLoadingNewModel ? 'Ajout...' : 'Ajouter' }}
              </Button>
            </DialogFooter>

          </DialogContent>
        </Dialog>
      </div>
      <div class="mb-6">
        <div class="relative w-full max-w-sm items-center">
          <Input v-model="searchTerm" id="search" type="text" placeholder="Rechercher un modèle" class="pl-10"/>
          <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
      <Search class="size-5 text-muted-foreground"/>
    </span>
        </div>
      </div>
      <div v-if="isLoading" class="flex justify-center mt-32 items-center">
        <Loader2 :size="30" class="animate-spin"/>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardModel v-for="(model, index) in filteredModels" :key="index" :model="model"/>
      </div>
    </div>

  </div>
</template>

<script setup>
import {computed, ref} from 'vue';
import {CirclePlus, Search, Loader2} from 'lucide-vue-next';
import CardModel from "~/components/ui/card/CardModel.vue";
import {Dialog, DialogContent, DialogFooter, DialogTrigger,} from '@/components/ui/dialog'

import Toaster from '@/components/ui/toast/Toaster.vue'
import {useToast} from '@/components/ui/toast/use-toast'
import {ToastAction} from '@/components/ui/toast'
import {useMCDStore} from "@/stores/mcd-store.js";
import {storeToRefs} from "pinia";

definePageMeta({
  layout: 'sidebar',
});

const mcdStore = useMCDStore()
const {models} = storeToRefs(mcdStore)

const {toast} = useToast()

const isLoading = ref(false);
const areModelsLoaded = ref(false)

onMounted(async () => {
  isLoading.value = true;
  models.value = await $fetch('/api/models/list', {method: 'GET'});
  isLoading.value = false
  areModelsLoaded.value = true
})

const searchTerm = ref("");

const filteredModels = computed(() => {
  return models?.value?.filter((card) =>
      card.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
});

const showModel = ref(false);
const newModel = ref({
  title: "",
});
const isLoadingNewModel = ref(false);
const onSubmit = async () => {
  if (newModel.value.title !== '') {
    isLoadingNewModel.value = true;
    const res = await $fetch('/api/models/create', {
      method: 'POST',
      body: {
        title: newModel.value.title
      },
    });

    if (res) {
      isLoadingNewModel.value = false;
      showModel.value = false;
      await navigateTo('/app/model/' + res.id.toString());
    }

  } else {
    toast({
      title: 'Champ vide',
      description: 'Vous devez renseigner un nom pour votre modèle.',
      variant: 'destructive',
      action: h(ToastAction, {
        altText: 'Réessayer',
      }, {
        default: () => 'Réessayer',
      }),
    });
  }

}
</script>


<!--
<template>



  <client-only>
    <div class="dndflow">
      <Sidebar/>

      <FlowMCD/>

      <FlowMLD/>
    </div>
  </client-only>
</template>
<script setup lang="ts">
import FlowMCD from "~/components/flow/FlowMCD.vue";
import FlowMLD from "~/components/flow/FlowMLD.vue";
import Sidebar from "~/components/flow/Sidebar.vue";
</script>
  -->
