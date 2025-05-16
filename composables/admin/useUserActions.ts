import { useMutation, useQueryClient } from '@tanstack/vue-query'

export function useUserActions() {
  const queryClient = useQueryClient()

  const addUser = useMutation({
    mutationFn :  async (payload: any) => {
      // génère le mot de passe aléatoire
      const password = Math.random().toString(36).slice(-8)
      return await $fetch('/api/auth/sign-up', {
        method: 'POST',
        body: { ...payload, password },
      })
    },
    onSuccess: (res) => queryClient.invalidateQueries(['users'])
  })

  const deleteUser = useMutation({
    mutationFn: (id) => $fetch(`/api/admin/users/delete`, { 
        method: 'DELETE',
        query: {id: id},
    }),
    onSuccess: () => queryClient.invalidateQueries(['users']),
  })

  const editUser = useMutation({
    mutationFn: ({ user, id }) => $fetch(`/api/admin/users/edit`, { 
        method: 'PUT',
        query: {id: id},
        body: user
    }),
    onSuccess: () => queryClient.invalidateQueries(['users']),
  })

  return {
    addUserMutation: async (user) => await addUser.mutateAsync(user),
    editUserMutation: async ({ user, id }) => await editUser.mutateAsync({ user, id }),
    deleteUserMutation: async (id: string) => await deleteUser.mutateAsync(id)
  }
}
