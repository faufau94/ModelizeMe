<template>
  <div class="py-6">
    <div class="max-w-6xl">
      <h2 class="text-xl mb-6 font-semibold">Sélectionnez une option</h2>
      <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div
            class="border rounded-xl relative"
            :class="[
                { ['border-black bg-gray-50']: isSelected(item.value) },
                item.hasOwnProperty('comingSoon') && item.comingSoon ? 'opacity-55 cursor-default pointer-events-none' : 'cursor-pointer hover:bg-gray-50 transition-all duration-150'] "
            v-for="item in stepDatas.options" :key="item.id"
            @click="selectOption(item.value)"
        >
          <div class="p-4">
            <div class="flex items-start gap-x-4">
              <Avatar class="h-14 w-14 bg-white border shadow-sm">
                <AvatarImage class="p-2" :src="`/logos/${item.logoName}.svg`" alt="@radix-vue" />
                <AvatarFallback>{{ item.logoName.charAt(0) }}</AvatarFallback>
              </Avatar>


              <div>
                <div class="flex gap-x-4">
                  <h1 class="text-md font-semibold">
                    {{ item.name }}
                  </h1>
                  <Badge variant="secondary" v-if="item.hasOwnProperty('comingSoon') && item.comingSoon">À venir...</Badge>
                </div>
                <p class="text-gray-600 text-sm mt-2">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {useCodeGeneratorStore} from "@/stores/code-generator-store.js";

defineProps({
  stepDatas: Object,
})


const codeGeneratorStore = useCodeGeneratorStore()
const {stepIndex, datas} = storeToRefs(codeGeneratorStore)

// Vérifier si l'option est sélectionnée
const isSelected = (value) => {
  switch (stepIndex.value) {
    case 2:
      return datas.value.framework === value
    case 3:
      return datas.value.orm === value
    case 4:
      return datas.value.database === value
    default:
      return false
  }
}

// Sélectionner l'option et mettre à jour directement la valeur dans le store
const selectOption = (value) => {
  switch (stepIndex.value) {
    case 2:
      datas.value.framework = value
      break
    case 3:
      datas.value.orm = value
      break
    case 4:
      datas.value.database = value
      break
    default:
      break
  }
}
</script>

<style scoped>
@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
