import { defineStore } from 'pinia'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { Workspace } from '@/components/dataTable/data/schema'

export const useWorkspaceStore = defineStore('workspace', () => {
  const queryClient = useQueryClient()

  const selectedWorkspaceId = ref<number | null>(null)

  // Mutation pour créer un workspace
  const addWorkspaceMutation = useMutation({
    mutationFn: async (payload: any) => {      
      return await $fetch('/api/admin/workspaces/create', {
        method: 'POST',
        body: payload,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces'])
    },
  })

  // Mutation pour éditer un workspace
  const editWorkspaceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await $fetch('/api/admin/workspaces/edit', {
        method: 'PUT',
        query: { id },
        body: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces'])
    },
  })

  // Mutation pour supprimer un workspace
  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await $fetch('/api/admin/workspaces/delete', {
        method: 'DELETE',
        query: { id },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces'])
    },
  })


  // Mutation pour récupérer la liste des workspaces
  const { data: workspaces, isLoading: isLoadingWorkspaces, error, suspense } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {

      const res = await $fetch('/api/admin/workspaces/list')

      if (res) {
        selectedWorkspaceId.value = res[0].id
        console.log('selectedWorkspaceId.value', selectedWorkspaceId.value);
        
        return res
      }
    }
  })

  // Read a workspace by ID and everytime the user change the workspace, it will be updated by listening to the workspaceId in the queryKey
  const { data: selectedWorkspace, isLoading: isLoadingSelectedWorkspace } = useQuery({
    queryKey: computed(() => ['workspace', selectedWorkspaceId.value]),
    queryFn: async () => {
      return await $fetch('/api/admin/workspaces/read', {
        method: 'GET',
        query: { id: selectedWorkspaceId.value },
      })
    }
  })

  // Expose des wrappers async pour appeler mutateAsync plus proprement
  return {
    addWorkspace: async (newWorkspace: any) => {
      return await addWorkspaceMutation.mutateAsync(newWorkspace)
    },
    editWorkspace: async (id: number, updatedData: any) => {
      return await editWorkspaceMutation.mutateAsync({ id, data: updatedData })
    },
    deleteWorkspace: async (id: string) => {
      return await deleteWorkspaceMutation.mutateAsync(id)
    },
    workspaces,
    isLoadingWorkspaces,
    selectedWorkspace,
    selectedWorkspaceId,
    isLoadingSelectedWorkspace,
  }
})