import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Model } from '@/components/dataTable/data/schema'
import { useModelStore } from '@/stores/api/model-store'
import { useWorkspaceStore } from '@/stores/api/workspace-store'

export const useModel = () => {
  const modelStore = useModelStore()
  const workspaceStore = useWorkspaceStore()
  const { selectedWorkspaceId } = storeToRefs(workspaceStore)
  const { selectedModelId } = storeToRefs(modelStore)
  const queryClient = useQueryClient()


  // — LIST —
  const {data: models, isLoading: isLoadingModels, isFetched: isModelsFetched, error, suspense } = useQuery<Model[]>({
    queryKey: computed(() => ['models', selectedWorkspaceId.value]),
    queryFn: async () => {
      console.log('new request for models', selectedWorkspaceId.value);
      
      const headers = useRequestHeaders(['cookie']) as HeadersInit
      const res = await $fetch<Model[]>('/api/models/list', {
        method: 'GET',
        query: { selectedWorkspaceId: selectedWorkspaceId.value },
        headers
      })
      return res
    },
    enabled: computed(() => selectedWorkspaceId.value !== null),
  })

    // — READ SELECTED —
    const {data: selectedModel, isLoading: isLoadingSelectedModel } = useQuery<Model>({
    queryKey: computed(() => ['model', selectedModelId.value]),
    queryFn: async ({ queryKey }) => {
      console.log('selectedModelId', selectedModelId.value);
      
      const [, id] = queryKey
      return await $fetch<Model>('/api/models/read', {
        method: 'GET',
        query: { id },
      })
    },
    staleTime: 0,
    enabled: computed(() => selectedModelId.value !== null),
    placeholderData: (previousData, previousQuery) => previousData,
   })

  // — CREATE —
  const addModelMutation = useMutation({
    mutationFn: async (payload: any) =>
      await $fetch('/api/models/create', { 
        method: 'POST', 
        body: payload 
      }),
    onSuccess: () => queryClient.invalidateQueries(['models']),
  })
  function addModel(newModel: any) {
    return addModelMutation.mutateAsync(newModel)
  } 

  // — EDIT —
  const editModelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      await $fetch('/api/models/update', { method: 'PUT', query: { id }, body: data }),
    onSuccess: () => queryClient.invalidateQueries(['models']),
  })
  const editModel = (id: number, updatedData: any) =>
    editModelMutation.mutateAsync({ id, data: updatedData })


  // — RENAME —
  const renametModelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      await $fetch('/api/models/rename', { method: 'PUT', query: { id }, body: data }),
    onSuccess: () => queryClient.invalidateQueries(['models']),
  })
  const renameModel = (id: number, updatedData: any) =>
    renametModelMutation.mutateAsync({ id, data: updatedData })

  // — DELETE —
  const deleteModelMutation = useMutation({
    mutationFn: async (id: string) =>
      await $fetch('/api/models/delete', { method: 'DELETE', query: { id } }),
    onSuccess: () => queryClient.invalidateQueries(['models']),
  })
  const deleteModel = (id: string) => deleteModelMutation.mutateAsync(id)

  

  

  return {
    // mutations
    addModel,
    editModel,
    renameModel,
    deleteModel,

    // list
    models,
    isLoadingModels,
    isModelsFetched,

    // selected
    selectedModelId: selectedModelId.value,
    selectedModel,
    isLoadingSelectedModel,
  }
}