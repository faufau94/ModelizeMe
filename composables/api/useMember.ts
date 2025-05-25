import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Member } from '@/components/dataTable/data/schema'
import { storeToRefs } from 'pinia'
import { useWorkspace } from '@/composables/api/useWorkspace'

/**
 * Composable for fetching and mutating members within a workspace context.
 */
export function useMember() {
  const { selectedWorkspaceId } = useWorkspace()
  const queryClient = useQueryClient()

  // — LIST MEMBERS IN WORKSPACE —
  const {
    data: members,
    isLoading: isLoadingMembers,
    error: listError
  } = useQuery<Member[]>({
    queryKey: computed(() => ['workspaceMembers', selectedWorkspaceId.value]),
    queryFn: async () => {
      const headers = useRequestHeaders(['cookie']) as HeadersInit
      return await $fetch<Member[]>('/api/members/list', {
        method: 'GET',
        query: { workspaceId: selectedWorkspaceId.value },
        headers
      })
    },
    enabled: computed(() => Boolean(selectedWorkspaceId.value))
  })

//   // — READ SELECTED MEMBER —
//   const {
//     data: selectedMember,
//     isLoading: isLoadingSelectedMember,
//     error: readError
//   } = useQuery<Member>({
//     queryKey: computed(() => ['member', selectedMemberId.value]),
//     queryFn: async () => {
//       return await $fetch<Member>('/api/members/read', {
//         method: 'GET',
//         query: { id: selectedMemberId.value }
//       })
//     },
//     enabled: computed(() => Boolean(selectedMemberId.value))
//   })

  // — CREATE MEMBER —
  const addMemberMutation = useMutation({
    mutationFn: async (payload: any) =>
      await $fetch('/api/members/add', { method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaceMembers', selectedWorkspaceId.value])
    }
  })
  const addMember = (member: any) => addMemberMutation.mutateAsync(member)

  // — UPDATE MEMBER —
  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      await $fetch('/api/members/update', {
        method: 'PUT',
        query: { id },
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaceMembers', selectedWorkspaceId.value])
    }
  })
  const updateMember = (id: string, data: any) => updateMemberMutation.mutateAsync({ id, data })

  // — DELETE MEMBER —
  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) =>
      await $fetch('/api/members/delete', { method: 'DELETE', query: { userId: id, workspaceId: selectedWorkspaceId.value } }),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaceMembers', selectedWorkspaceId.value])
    }
  })
  const deleteMember = (id: string) => deleteMemberMutation.mutateAsync(id)

  return {
    // list
    members,
    isLoadingMembers,
    listError,

    // mutations
    addMember,
    updateMember,
    deleteMember
  }
}
