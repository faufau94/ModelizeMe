import { defineStore } from 'pinia'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

export const useWorkspaceStore = defineStore('class', () => {
  const queryClient = useQueryClient()

  // Mutation pour créer une classe
  const addWorkspaceMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await $fetch('/api/admin/workspaces/create', {
        method: 'POST',
        body: payload,
      })
    },
    onSuccess: () => {
      // Invalide et re-fetch la liste 'workspaces'
      queryClient.invalidateQueries(['workspaces'])
    },
  })

  // Mutation pour éditer une classe
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

  // Mutation pour supprimer une classe
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

  

  // Expose des wrappers async pour appeler mutateAsync plus proprement
  return {
    addWorkspace: async (newWorkspace: any) => {
      return await addWorkspaceMutation.mutateAsync(newWorkspace)
    },
    editWorkspace: async (id: number, updatedData: any) => {
      return await editWorkspaceMutation.mutateAsync({ id, data: updatedData })
    },
    deleteWorkspace: async (id: string) => {
      console.log('id', id);
      
      return await deleteWorkspaceMutation.mutateAsync(id)
    },
  }
})