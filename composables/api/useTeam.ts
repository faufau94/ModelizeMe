// composables/api/useTeam.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useWorkspace } from '@/composables/api/useWorkspace'
import type { Team, TeamMember } from '@/components/dataTable/data/schema'
import { authClient } from '~/lib/auth-client'

export function useTeam() {
  const { selectedWorkspaceId } = useWorkspace()
  const route = useRoute()

  // dérive l'ID de l'équipe depuis l'URL
  const selectedTeamId = computed<string | null>(() => {
    const t = route.params.teamId
    return t && t !== 'undefined' ? String(t) : null
  })

  const queryClient = useQueryClient()

  // // — LIST —
  // const {
  //   data: teams,
  //   isLoading: isLoadingTeams,
  //   isFetched: isTeamsFetched,
  // } = useQuery<Team[]>({
  //   queryKey: computed(() => ['teams', selectedWorkspaceId.value as string | undefined]),
  //   queryFn: async () => {
  //     if (!selectedWorkspaceId.value) return []
  //     return await authClient.organization.listTeams({
  //       query: { organizationId: selectedWorkspaceId.value as string | undefined }
  //     }).then((res: any) => res.data)
  //   },
  //   enabled: computed(() => !!selectedWorkspaceId.value),
  // })

  // — READ SELECTED —
  const {
    data: selectedTeam,
    isLoading: isLoadingSelectedTeam,
  } = useQuery<Team>({
    queryKey: computed(() => ['team', selectedTeamId.value as string | undefined]),
    queryFn: async ({ queryKey }) => {
      const [, id] = queryKey
      if (!id) return undefined
      // fallback: list all teams and find by id
      const allTeams = await authClient.organization.listTeams({ query: { organizationId: selectedWorkspaceId.value as string | undefined } }).then((res: any) => res.data)
      return allTeams.find((t: any) => t.id === id)
    },
    enabled: computed(() => !!selectedTeamId.value),
    placeholderData: (prev) => prev ?? undefined,
  })

  // — CREATE —
  const createTeamMutation = useMutation({
    mutationFn: async (payload: Partial<Team>) => {
      const name = payload.name as string
        const description = payload.description as string | undefined
        const color = payload.color as string | undefined
        const maxMembers = payload.maxMembers as number | undefined
      if (!name) throw new Error('Team name is required')
      return await authClient.organization.createTeam({
        name,
        description,
        color,
        maxMembers,
        organizationId: selectedWorkspaceId.value as string | undefined
      }).then((res: any) => res.data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', selectedWorkspaceId.value as string | undefined] }),
  })
  const createTeam = (data: Partial<Team>) => createTeamMutation.mutateAsync(data)

  // — UPDATE —
  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Team> }) => {
      const updateData: { name?: string } = {}
      if (data.name) updateData.name = data.name
      return await authClient.organization.updateTeam({
        teamId: id,
        data: updateData
      }).then((res: any) => res.data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', selectedWorkspaceId.value as string | undefined] }),
  })
  const updateTeam = (id: string, data: Partial<Team>) =>
    updateTeamMutation.mutateAsync({ id, data })

  // — DELETE —
  const deleteTeamMutation = useMutation({
    mutationFn: async (id: string) =>
      await authClient.organization.removeTeam({
        teamId: id,
        organizationId: selectedWorkspaceId.value as string | undefined
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', selectedWorkspaceId.value as string | undefined] }),
  })
  const deleteTeam = (id: string) => {
      console.log('Deleting team with id:', id)
      console.log('Selected workspace id:', selectedWorkspaceId.value)
      return deleteTeamMutation.mutateAsync(id)
  }

  // — ASSIGN MEMBERS —
  const assignMembersMutation = useMutation({
    mutationFn: async ({ teamId, assignments }: { teamId: string; assignments: TeamMember[] }) =>
      await $fetch<Team>('/api/teams/assign', {
        method: 'POST',
        query: { id: teamId },
        body: { assignments }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', selectedTeamId.value as string | undefined] })
      queryClient.invalidateQueries({ queryKey: ['teams', selectedWorkspaceId.value as string | undefined] })
    },
  })
  const assignMembers = (teamId: string, assignments: TeamMember[]) =>
    assignMembersMutation.mutateAsync({ teamId, assignments })

  // — RENAME THE TEAM —
  const renameTeamMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      await authClient.organization.updateTeam({
        teamId: id,
        data: { name }
      }).then((res: any) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', selectedWorkspaceId.value as string | undefined] }),
  })
  const renameTeam = (id: string, name: string) =>
    renameTeamMutation.mutateAsync({ id, name })

  return {
    // state & queries
    // teams,
    // isLoadingTeams,
    // isTeamsFetched,

    selectedTeamId,
    selectedTeam,
    isLoadingSelectedTeam,

    // mutations
    createTeam,
    updateTeam,
    deleteTeam,
    assignMembers,
    renameTeam,

    // pour debug ou usage avancé
    _mutations: {
      createTeamMutation,
      updateTeamMutation,
      deleteTeamMutation,
      assignMembersMutation,
    }
  }
}
