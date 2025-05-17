// stores/class-store.ts
import { defineStore } from 'pinia'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

export const useClassStore = defineStore('class', () => {
  const queryClient = useQueryClient()

  // Mutation pour créer une classe
  const addClassMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await $fetch('/api/admin/classes/create', {
        method: 'POST',
        body: payload,
      })
    },
    onSuccess: () => {
      // Invalide et re-fetch la liste 'classes'
      queryClient.invalidateQueries(['classes'])
    },
  })

  // Mutation pour éditer une classe
  const editClassMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await $fetch('/api/admin/classes/edit', {
        method: 'PUT',
        query: { id },
        body: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['classes'])
    },
  })

  // Mutation pour supprimer une classe
  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => {
      return await $fetch('/api/admin/classes/delete', {
        method: 'DELETE',
        query: { id },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['classes'])
    },
  })

  

  // Expose des wrappers async pour appeler mutateAsync plus proprement
  return {
    addClass: async (newClass: any) => {
      return await addClassMutation.mutateAsync(newClass)
    },
    editClass: async (id: number, updatedData: any) => {
      return await editClassMutation.mutateAsync({ id, data: updatedData })
    },
    deleteClass: async (id: string) => {
      console.log('id', id);
      
      return await deleteClassMutation.mutateAsync(id)
    },
  }
})