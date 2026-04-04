import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Model } from '@/components/dataTable/data/schema'
import { useModelStore } from '@/stores/api/model-store'
import { useWorkspace } from '@/composables/api/useWorkspace'

export const useModel = () => {
  const modelStore = useModelStore()
  const { selectedWorkspaceId } = useWorkspace()
  const { selectedModelId } = storeToRefs(modelStore)
  const queryClient = useQueryClient()

  const route = useRoute()
  const teamId = computed(() => route.params.teamId as string|undefined|null)


  // - LIST -
  const {data: models, isLoading: isLoadingModels, isFetched: isModelsFetched, error, suspense } = useQuery<Model[]>({
    queryKey: computed(() => ['models', selectedWorkspaceId.value, teamId.value]),
    queryFn: async () => {
      const headers = useRequestHeaders(['cookie']) as HeadersInit

      const params: Record<string, any> = {
        selectedWorkspaceId: selectedWorkspaceId.value
      }
      if (teamId.value) {
        params.teamId = teamId.value
      }

      const res = await $fetch<Model[]>('/api/models/list', {
        method: 'GET',
        query: params,
        headers
      })
      return res
    },
    enabled: computed(() => selectedWorkspaceId.value !== null),
  })

    // - READ SELECTED -
    const {data: selectedModel, isLoading: isLoadingSelectedModel } = useQuery<Model>({
    queryKey: computed(() => ['model', selectedModelId.value]),
    queryFn: async ({ queryKey }) => {
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

  // - CREATE -
  const addModelMutation = useMutation({
    mutationFn: async (payload: any) =>
      await $fetch('/api/models/create', { 
        method: 'POST', 
        body: {
          ...payload,
          selectedWorkspaceId: selectedWorkspaceId.value,
          ...(teamId.value ? { teamId: teamId.value } : {}),
        }
      }),
    onSuccess: () => queryClient.invalidateQueries(['models']),
  })
  function addModel(newModel: any) {
    return addModelMutation.mutateAsync(newModel)
  } 

  // - EDIT -
  const updateModelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      await $fetch('/api/models/update', { method: 'PUT', query: { id }, body: data }),
    onSuccess: () => queryClient.invalidateQueries(['models']),
  })
  const updateModel = (id: number, updatedData: any) =>
    updateModelMutation.mutateAsync({ id, data: updatedData })


  // - RENAME -
  const renametModelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      await $fetch('/api/models/rename', { method: 'PUT', query: { id }, body: data }),
    onSuccess: () => queryClient.invalidateQueries(['models']),
  })
  const renameModel = (id: number, updatedData: any) =>
    renametModelMutation.mutateAsync({ id, data: updatedData })

  // - DELETE -
  const deleteModelMutation = useMutation({
    mutationFn: async ({id, body}) =>
      await $fetch('/api/models/delete', { method: 'DELETE', query: { id }, body: body }),
    onSuccess: () => queryClient.invalidateQueries(['models']),
  })
  const deleteModel = (id: string, body: any) => deleteModelMutation.mutateAsync({id, body})

  // - BULK DELETE -
  const bulkDeleteModelsMutation = useMutation({
    mutationFn: async (ids: string[]) =>
      await $fetch('/api/models/bulk-delete', { method: 'POST', body: { ids } }),
    onSuccess: () => queryClient.invalidateQueries(['models']),
  })
  const bulkDeleteModels = (ids: string[]) => bulkDeleteModelsMutation.mutateAsync(ids)

  // - DUPLICATE -
  const duplicateModelMutation = useMutation({
    mutationFn: async ({ modelId, targetWorkspaceId }: { modelId: string; targetWorkspaceId?: string }) =>
      await $fetch('/api/models/duplicate', { method: 'POST', body: { modelId, targetWorkspaceId } }),
    onSuccess: () => queryClient.invalidateQueries(['models']),
  })
  const duplicateModel = (modelId: string, targetWorkspaceId?: string) =>
    duplicateModelMutation.mutateAsync({ modelId, targetWorkspaceId })

  // - BULK MOVE -
  const bulkMoveModelsMutation = useMutation({
    mutationFn: async ({ ids, teamId }: { ids: string[]; teamId: string | null }) =>
      await $fetch('/api/models/bulk-move', { method: 'POST', body: { ids, teamId } }),
    onSuccess: () => queryClient.invalidateQueries(['models']),
  })
  const bulkMoveModels = (ids: string[], teamId: string | null) =>
    bulkMoveModelsMutation.mutateAsync({ ids, teamId })

  // - BULK COPY TO WORKSPACE -
  const bulkCopyModelsMutation = useMutation({
    mutationFn: async ({ ids, targetWorkspaceId }: { ids: string[]; targetWorkspaceId: string }) =>
      await $fetch('/api/models/bulk-copy', { method: 'POST', body: { ids, targetWorkspaceId } }),
    onSuccess: () => queryClient.invalidateQueries(['models']),
  })
  const bulkCopyModels = (ids: string[], targetWorkspaceId: string) =>
    bulkCopyModelsMutation.mutateAsync({ ids, targetWorkspaceId })

  
  return {
    // mutations
    addModel,
    updateModel,
    renameModel,
    deleteModel,
    bulkDeleteModels,
    bulkMoveModels,
    bulkCopyModels,
    duplicateModel,

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