import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useModelStore = defineStore('model', () => {
  const selectedModelId = ref<number | null>(null)

  function setSelectedModelId(id: number) {
    selectedModelId.value = id
  }

  return {
    selectedModelId,
    setSelectedModelId,
  }
})
