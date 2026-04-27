// ~/composables/useWorkspace.ts
import {computed, watch} from 'vue'
import {useMutation, useQuery, useQueryClient} from '@tanstack/vue-query'
import type {Workspace} from '@/components/dataTable/data/schema'
import {authClient, useSession} from '~/lib/auth-client'

export const useWorkspace = () => {
  const route = useRoute()
  const session = useSession()
  const queryClient = useQueryClient()
  const activeOrganizationId = computed(() => session.value?.data?.session?.activeOrganizationId)

  const selectedWorkspaceId = computed<string|null>(() => {

    if(route.path.startsWith('/app/workspace/')) {
      // si l'URL fournit workspaceId, on l'utilise
      if (route.params.workspaceId && route.params.workspaceId !== 'undefined') {
        return String(route.params.workspaceId)
      }

      // sinon, on tombe sur la valeur stockée en session
      return activeOrganizationId.value ?? null
    }

    if(route.path.startsWith('/app/model/')) {
      return null
    }
  })

  // Sync session activeOrganizationId with URL workspaceId (e.g. after OAuth redirects)
  watch(
    [selectedWorkspaceId, activeOrganizationId],
    async ([urlWorkspaceId, sessionOrgId]) => {
      if (
        urlWorkspaceId &&
        sessionOrgId !== undefined &&
        sessionOrgId !== null &&
        urlWorkspaceId !== sessionOrgId
      ) {
        try {
          await authClient.organization.setActive({ organizationId: urlWorkspaceId })
          // Refetch all workspace-dependent data after org sync
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['activeMember'] }),
            queryClient.invalidateQueries({ queryKey: ['workspace', urlWorkspaceId] }),
            queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
          ])
        } catch (e) {
          console.warn('Failed to sync active organization:', e)
        }
      }
    },
    { immediate: true }
  )

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
      return organizations.data?.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ) || []
    },
  })

  // READ SELECTED WORKSPACE
  const {data: selectedWorkspace, isLoading: isLoadingSelectedWorkspace } = useQuery<Workspace>({
    queryKey: computed(() => ['workspace', selectedWorkspaceId.value]),
    queryFn: async ({ queryKey }) => {
      const workspaceId = route.params.workspaceId

      // Récupérer l'organisation de base avec Better Auth
      const organization = await authClient.organization.getFullOrganization({
        query: { organizationId: String(workspaceId) }
      })

      if (!organization.data) {
        throw new Error('Workspace not found')
      }

      // Enrichir les équipes avec les membres et modèles
      const teamsWithCounts = await Promise.all(
        (organization.data.teams || []).map(async (team) => {
          const [members, models] = await Promise.all([
            $fetch('/api/team-members/list', {
              query: { teamId: team.id }
            }).catch(() => []),
            $fetch('/api/teams/models', {
              query: { teamId: team.id }
            }).catch(() => [])
          ])

          return {
            ...team,
            members,
            models,
          }
        })
      )

      // Sort teams in ascending order by createdAt
      const sortedTeams = teamsWithCounts.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )

      return {
        ...organization.data,
        teams: sortedTeams,
      }
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
      return await authClient.organization.delete({ organizationId: id })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  })
  const deleteWorkspace = (id: string) => deleteWorkspaceMutation.mutateAsync(id)

  // SWITCH WORKSPACE (Set Active Organization)
  const switchWorkspace = async (organizationId: string) => {
    await authClient.organization.setActive({ organizationId: organizationId })
    await queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    await navigateTo(goToThisWorkspaceUrl('', organizationId))
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
  const goToThisWorkspaceUrl = (addToUrl?: string, workspaceId?: string) => {
    const id = workspaceId ?? selectedWorkspaceId.value
    return addToUrl ? `/app/workspace/${id}/${addToUrl}` : `/app/workspace/${id}`
  }

  // Add activeMember as a reactive query
  const { data: activeMember, isLoading: isLoadingActiveMember } = useQuery({
    queryKey: computed(() => ['activeMember', selectedWorkspaceId.value]),
    queryFn: async () => {
      return await authClient.organization.getActiveMember().then(res => res.data)
    },
    enabled: computed(() => !!selectedWorkspaceId.value),
  })

  // Role-based computed properties
  const getIsOwner = computed(() => {
    return session?.value?.data?.user?.id === activeMember?.value?.user?.id && activeMember?.value?.role === 'owner'
  })

  const getIsAdmin = computed(() => {
    return session?.value?.data?.user?.id === activeMember?.value?.user?.id && activeMember?.value?.role === 'admin'
  })

  const getIsOwnerOrAdmin = computed(() => {
    return getIsOwner.value || getIsAdmin.value
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
    getIsAdmin,
    getIsOwnerOrAdmin,
    activeMember,
    isLoadingActiveMember,
  }
}