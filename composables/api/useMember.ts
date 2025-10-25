import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Member } from '@/components/dataTable/data/schema'
import { storeToRefs } from 'pinia'
import { useWorkspace } from '@/composables/api/useWorkspace'
import { authClient } from '~/lib/auth-client'

type OrganizationRole = 'admin' | 'member' | 'owner'

/**
 * Composable for fetching and mutating members within a workspace context.
 */
export function useMember() {
  const { selectedWorkspaceId } = useWorkspace()
  const queryClient = useQueryClient()

  // // — LIST MEMBERS IN WORKSPACE —
  // const {
  //   data: members,
  //   isLoading: isLoadingMembers,
  //   error: listError
  // } = useQuery<Member[]>({
  //   queryKey: computed(() => ['workspaceMembers', selectedWorkspaceId.value]),
  //   queryFn: async () => {
  //     const headers = useRequestHeaders(['cookie']) as HeadersInit
  //     return await $fetch<Member[]>('/api/members/list', {
  //       method: 'GET',
  //       query: { workspaceId: selectedWorkspaceId.value },
  //       headers
  //     })
  //   },
  //   enabled: computed(() => Boolean(selectedWorkspaceId.value))
  // })


  // — CREATE MEMBER —
  const addMemberMutation = useMutation({
    mutationFn: async (payload: any) => {
        const { email } = payload;
        return await authClient.organization.inviteMember({
            organizationId: selectedWorkspaceId.value,
            email,
            role: 'member',
            resend: true,
        })
    },
      //await $fetch('/api/members/add', { method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaceMembers', selectedWorkspaceId.value])
    }
  })
  const addMember = (member: any) => addMemberMutation.mutateAsync(member)

  // — UPDATE MEMBER —
  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await authClient.organization.updateMemberRole({
        memberId: id,
        role: data.role,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', selectedWorkspaceId.value] })
    }
  })
  const updateMember = (id: string, data: any) => updateMemberMutation.mutateAsync({ id, data })

  // — DELETE MEMBER —
  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      return await authClient.organization.removeMember({
        memberIdOrEmail: id,
        organizationId: selectedWorkspaceId.value as string
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', selectedWorkspaceId.value] })
    }
  })
  const deleteMember = (id: string) => deleteMemberMutation.mutateAsync(id)

  return {
    // list
    // members,
    // isLoadingMembers,
    // listError,

    // mutations
    addMember,
    updateMember,
    deleteMember,
  }
}
