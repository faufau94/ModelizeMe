// stores/user-store.ts
import { defineStore } from 'pinia'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

export const useUserStore = defineStore('user', () => {
  const queryClient = useQueryClient()

  // --- 1) Création des mutations ---

  // Créer un utilisateur (avec mot de passe aléatoire)
  const addUserMutation = useMutation({
    mutationFn: async (payload: any) => {
      const password = Math.random().toString(36).slice(-8)
      return await $fetch('/api/auth/sign-up', {
        method: 'POST',
        body: { ...payload, password },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
    },
  })

  // Éditer un utilisateur
  const editUserMutation = useMutation({
    mutationFn: async ({ user, id }: { user: any; id: string }) => {
      return await $fetch('/api/admin/users/edit', {
        method: 'PUT',
        query: { id },
        body: user,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
    },
  })

  // Supprimer un utilisateur
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await $fetch('/api/admin/users/delete', {
        method: 'DELETE',
        query: { id },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
    },
  })

  // --- 2) Wrappers pour appeler mutateAsync facilement ---

  function addUser(user: any) {
    return addUserMutation.mutateAsync(user)
  }

  function editUser(user: any, id: string) {
    return editUserMutation.mutateAsync({ user, id })
  }

  function deleteUser(id: string) {
    return deleteUserMutation.mutateAsync(id)
  }

  // --- 3) Exposition du store ---

  return {
    // méthodes CRUD
    addUser,
    editUser,
    deleteUser,
  }
})