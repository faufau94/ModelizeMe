// ~/composables/useWorkspace.ts
import { computed, ref, onMounted } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Workspace, WorkspaceRole } from '@/components/dataTable/data/schema'
import { useSession } from '~/lib/auth-client'
import { authClient } from '~/lib/auth-client'

export const useWorkspace = () => {
  const route = useRoute()
  const session = useSession()
  const queryClient = useQueryClient()
  const activeOrganizationId = computed(() => session.value?.data?.session?.activeOrganizationId)


  const selectedWorkspaceId = computed<string|null>(() => {

    if(route.path.startsWith('/app/workspace/')) {
      console.log('route', route.params.workspaceId)
      // si l'URL fournit workspaceId, on l'utilise
      if (route.params.workspaceId !== 'undefined' || route.params.workspaceId !== undefined) {
        return String(route.params.workspaceId)
      }

      // sinon, on tombe sur la valeur stockée en session
      return activeOrganizationId.value ?? null
    }

    if(route.path.startsWith('/app/model/')) {
      return null
    }
  })

  const workspaceShareLink = computed(() => {
    if (!selectedWorkspaceId.value) return ''
    return `${useRuntimeConfig().public.baseUrl}/app/workspace/${selectedWorkspaceId.value}/join/${selectedWorkspace.value?.inviteCode}`
  })
  

  // LIST WORKSPACES (Organizations)
  const { data: workspaces, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const organizations = await authClient.organization.list()
      // Sort organizations by createdAt in ascending order
      const sortedOrganizations = organizations.data?.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ) || []
      return sortedOrganizations
    },
  })

  // READ SELECTED WORKSPACE
  const {data: selectedWorkspace, isLoading: isLoadingSelectedWorkspace } = useQuery<Workspace>({
    queryKey: computed(() => ['workspace', selectedWorkspaceId.value]),
    queryFn: async ({ queryKey }) => {
      console.log('selectedWorkspaceId.value', selectedWorkspaceId.value)
      const workspaceId = route.params.workspaceId
      const organization = await authClient.organization.getFullOrganization({
        query: { organizationId: String(workspaceId) }
      })
      
      if (!organization.data) {
        throw new Error('Workspace not found')
      }

      // Sort teams in ascending order by createdAt
      if (organization.data.teams) {
        organization.data.teams = organization.data.teams.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      }

      return organization.data as Workspace
    },
    staleTime: 0,
    enabled: computed(() => selectedWorkspaceId.value !== null && selectedWorkspaceId.value !== undefined),
  })

  // CREATE WORKSPACE (Organization)
  const addWorkspaceMutation = useMutation({
    mutationFn: async (payload) => {
      return await authClient.organization.create({ ...payload })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  })
  const addWorkspace = (newWorkspace) => addWorkspaceMutation.mutateAsync(newWorkspace)

  // UPDATE WORKSPACE (Organization)
  const updateWorkspaceMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await authClient.organization.update({ organizationId: id, data: {
        ...data,
        metadata: {
          description: data.description
        }
      } })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  })
  const updateWorkspace = (id, updatedData) => updateWorkspaceMutation.mutateAsync({ id, data: updatedData })

  // DELETE WORKSPACE (Organization)
  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("deleteWorkspaceMutation", id)
      return await authClient.organization.delete({ organizationId: id })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  })
  const deleteWorkspace = (id: string) => deleteWorkspaceMutation.mutateAsync(id)

  // SWITCH WORKSPACE (Set Active Organization)
  const switchWorkspace = async (organizationId: string) => {
    await authClient.organization.setActive({ organizationId: organizationId })
    await queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    await navigateTo(`/app/workspace/${organizationId}/dashboard`)
  }

  // // GET WORKSPACE ROLES (Organization Roles)
  // const { data: workspaceRoles, isLoading: isLoadingWorkspaceRoles } = useQuery({
  //   queryKey: ['workspaceRoles', activeOrganizationId],
  //   queryFn: async () => {
  //     if (!activeOrganizationId.value) return []
  //     const res = await authClient.organization.getRoles({ id: activeOrganizationId.value })
  //     return res.data
  //   },
  //   enabled: computed(() => !!activeOrganizationId.value),
  // })

  // JOIN WORKSPACE
  const joinWorkspace = async (workspaceId: string, inviteCode: string) => {
    const res = await authClient.organization.join({ workspaceId, inviteCode })

    if (res.status !== 200) {
      return {
        status: 404,
        body: { message: 'Workspace not found or invalid invite code' },
      }
    }

    // Rafraîchir la liste des workspaces après avoir rejoint un workspace
    await queryClient.invalidateQueries(['workspaces'])
    // Mettre à jour le workspace sélectionné
    await switchWorkspace(workspaceId)
  }

  // REGENERATE WORKSPACE INVITE CODE
  const regenerateWorkspaceInviteCode = async () => {
    const res = await authClient.organization.regenerateInviteCode({ workspaceId: selectedWorkspaceId.value })

    await queryClient.invalidateQueries(['workspace', selectedWorkspaceId.value])
  }

  // COPY WORKSPACE LINK
  const copyWorkspaceLink = async () => {
    await navigator.clipboard.writeText(workspaceShareLink.value)
  }

  // Go to Workspace URL
  const goToThisWorkspaceUrl = (addToUrl: string) => {
    return `/app/workspace/${selectedWorkspaceId.value}/${addToUrl}`
  }

  // Add activeMember as a reactive query
  const { data: activeMember, isLoading: isLoadingActiveMember } = useQuery({
    queryKey: ['activeMember'],
    queryFn: async () => {
      return await authClient.organization.getActiveMember().then(res => res.data)
    }
  })

  // Fix getIsOwner to use the resolved value
  const getIsOwner = computed(() => {
    return session?.value?.data?.user?.id === activeMember?.value?.user?.id && activeMember?.value?.role === 'owner'
  })

  return {
    workspaces,
    isLoadingWorkspaces,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    switchWorkspace,
    // workspaceRoles,
    // isLoadingWorkspaceRoles,
    activeOrganizationId,
    joinWorkspace,
    copyWorkspaceLink,
    goToThisWorkspaceUrl,
    regenerateWorkspaceInviteCode,
    selectedWorkspaceId,
    selectedWorkspace,
    isLoadingSelectedWorkspace,
    getIsOwner,
    activeMember,
    isLoadingActiveMember,
  }
}