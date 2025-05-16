// stores/class-store.ts
import { defineStore } from 'pinia'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

export const useClassStore = defineStore('class', () => {
  const queryClient = useQueryClient()

  // Mutation pour créer une classe
  const addClass = useMutation({
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
  const editClass = useMutation({
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
  const deleteClass = useMutation({
    mutationFn: async (id: number) => {
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
    addClassMutation: async (newClass: any) => {
      return await addClass.mutateAsync(newClass)
    },
    editClassMutation: async (id: number, updatedData: any) => {
      return await editClass.mutateAsync({ id, data: updatedData })
    },
    deleteClassMutation: async (id: number) => {
      return await deleteClass.mutateAsync(id)
    },
  }
})