import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWorkspaceStore = defineStore('workspace', () => {
  const selectedWorkspaceId = ref<number | null>(null)

  function setSelectedWorkspaceId(id: number) {
    selectedWorkspaceId.value = id
  }

  return {
    selectedWorkspaceId,
    setSelectedWorkspaceId,
  }
})
