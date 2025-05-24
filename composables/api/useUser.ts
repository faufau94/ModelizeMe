import { useMutation, useQueryClient } from '@tanstack/vue-query'

export const useUser = () => {

  // 1) Add user
  const addUserMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await $fetch('/api/auth/sign-up', {
        method: 'POST',
        body: { ...payload },
      })
    },
    onSuccess: () => {
      const queryClient = useQueryClient()

      queryClient.invalidateQueries(['users'])
    },
  })

  // 2) Edit user
  const editUserMutation = useMutation({
    mutationFn: async ({ user, id }: { user: any; id: string }) => {
      return await $fetch('/api/admin/users/edit', {
        method: 'PUT',
        query: { id },
        body: user,
      })
    },
    onSuccess: () => {
      const queryClient = useQueryClient()

      queryClient.invalidateQueries(['users'])
    },
  })

  // 3) Delete user
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await $fetch('/api/admin/users/delete', {
        method: 'DELETE',
        query: { id },
      })
    },
    onSuccess: () => {
      const queryClient = useQueryClient()

      queryClient.invalidateQueries(['users'])
    },
  })

  // 4) Exposed wrappers
  function addUser(user: any) {
    return addUserMutation.mutateAsync(user)
  }

  function editUser(user: any, id: string) {
    return editUserMutation.mutateAsync({ user, id })
  }

  function deleteUser(id: string) {
    return deleteUserMutation.mutateAsync(id)
  }

  // 5) (Optional) Expose status flags
  return {
    addUser,
    editUser,
    deleteUser,

    // mutation states if you need them in UI:
    isAdding:   addUserMutation.isLoading,
    addError:   addUserMutation.error,
    isEditing:  editUserMutation.isLoading,
    editError:  editUserMutation.error,
    isDeleting: deleteUserMutation.isLoading,
    deleteError: deleteUserMutation.error,
  }
}