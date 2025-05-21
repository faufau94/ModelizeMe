// ~/composables/useWorkspace.ts
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient, keepPreviousData  } from '@tanstack/vue-query'
import type { Workspace } from '@/components/dataTable/data/schema'
import { useWorkspaceStore } from '@/stores/api/workspace-store'

export const useWorkspace = () => {
  const workspaceStore = useWorkspaceStore()
  const { selectedWorkspaceId } = storeToRefs(workspaceStore)
  const queryClient = useQueryClient()


  // — LIST —
  const {data: workspaces, isLoading: isLoadingWorkspaces, error, suspense } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const headers = useRequestHeaders(['cookie']) as HeadersInit
      const res = await $fetch<Workspace[]>('/api/workspaces/list', {
        method: 'GET',
        headers
      })
      if (res?.length && selectedWorkspaceId.value === null) {
        selectedWorkspaceId.value = parseInt(res[0].id)
      }
      return res
    },
    })

    // — READ SELECTED —
    const {data: selectedWorkspace, isLoading: isLoadingSelectedWorkspace } = useQuery<Workspace>({
      queryKey: computed(() => ['workspace', selectedWorkspaceId.value]),
      queryFn: async ({ queryKey }) => {
        const [, id] = queryKey
        
        return await $fetch<Workspace>('/api/workspaces/read', {
          method: 'GET',
          query: { id },
        })
      },
      staleTime: 0,
      enabled: computed(() => selectedWorkspaceId.value !== null),
    })

  // — CREATE —
  const addWorkspaceMutation = useMutation({
    mutationFn: async (payload: any) =>
      await $fetch('/api/workspaces/create', { method: 'POST', body: payload }),
    onSuccess: () => queryClient.invalidateQueries(['workspaces']),
  })
  function addWorkspace(newWorkspace: any) {
    return addWorkspaceMutation.mutateAsync(newWorkspace)
  } 

  // — EDIT —
  const editWorkspaceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      await $fetch('/api/workspaces/edit', { method: 'PUT', query: { id }, body: data }),
    onSuccess: () => queryClient.invalidateQueries(['workspaces']),
  })
  const editWorkspace = (id: number, updatedData: any) =>
    editWorkspaceMutation.mutateAsync({ id, data: updatedData })

  // — DELETE —
  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (id: string) =>
      await $fetch('/api/workspaces/delete', { method: 'DELETE', query: { id } }),
    onSuccess: () => queryClient.invalidateQueries(['workspaces']),
  })
  const deleteWorkspace = (id: string) => deleteWorkspaceMutation.mutateAsync(id)

  

  

  return {
    // mutations
    addWorkspace,
    editWorkspace,
    deleteWorkspace,

    // list
    workspaces,
    isLoadingWorkspaces,

    // selected
    selectedWorkspaceId: selectedWorkspaceId.value,
    selectedWorkspace,
    isLoadingSelectedWorkspace,
  }
}