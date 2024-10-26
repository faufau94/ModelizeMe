<template>

  <div class="w-full max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold">Galerie</h1>
    <div class="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 mt-10">

      <div class="bg-background rounded-lg">

        <h2 class="text-md font-bold mb-4">Categories</h2>
        <div class="grid gap-4">
          <Label class="flex items-center gap-2 font-normal" v-for="(category, index) in categories" :key="index">
            <Checkbox
                :checked="isCategorySelected(category.value)"
                @update:checked="toggleCategory(category.value, $event)"
            />
            {{ category.name }}
          </Label>
        </div>
      </div>
      <div>
        <div>
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
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          <CardModel v-for="(model, index) in filteredModels" :key="index" :model="model"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed} from 'vue'
import {Label} from '@/components/ui/label'
import {Checkbox} from '@/components/ui/checkbox'
import {Input} from '@/components/ui/input'

import CardModel from "~/components/ui/card/CardModel.vue";

import {CirclePlus, Loader2, LucideCable, Search} from 'lucide-vue-next'

definePageMeta({
  layout: 'sidebar',
});

const isLoading = ref(false);
const selectedCategories = ref([])
const searchTerm = ref("")

const categories = [
  {name: 'E-commerce', value: 'ecommerce'},
  {name: 'CRM', value: 'crm'},
  {name: 'E-learning', value: 'elearning'},
  {name: 'Billing', value: 'billing'},
]
const items = [
  {
    name: "Model 1",
    nodes: [],
    edges: [],
    category: 'ecommerce',
  },
  {
    name: "Model 2",
    nodes: [],
    edges: [],
    category: 'ecommerce',
  },
  {
    name: "Model 3",
    nodes: [],
    edges: [],
    category: 'billing',
  },
  {
    name: "Model 4",
    nodes: [],
    edges: [],
    category: 'ecommerce',
  },
  {
    name: "Model 5",
    nodes: [],
    edges: [],
    category: 'elearning',
  },
]

const filteredModels = computed(() => {
  if (selectedCategories.value.length > 0) {
    return items.filter((item) => selectedCategories.value.includes(item.category))
  } else if (searchTerm.value.trim() !== "") {
    return items.filter((item) => item.name.toLowerCase().includes(searchTerm.value.toLowerCase()))
  } else {
    return items
  }
})

// Fonction pour vérifier si la catégorie est déjà sélectionnée
const isCategorySelected = (categoryValue) => {
  return selectedCategories.value.includes(categoryValue)
}

// Fonction pour ajouter ou retirer la catégorie dans le tableau
const toggleCategory = (categoryValue, isChecked) => {
  if (isChecked) {
    // Ajouter la catégorie si elle est cochée
    if (!selectedCategories.value.includes(categoryValue)) {
      selectedCategories.value.push(categoryValue)
    }
  } else {
    // Retirer la catégorie si elle est décochée
    selectedCategories.value = selectedCategories.value.filter(
        (c) => c !== categoryValue
    )
  }
}

</script>
