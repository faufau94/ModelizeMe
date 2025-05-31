// composables/api/useTeam.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useWorkspace } from '@/composables/api/useWorkspace'
import type { Team, TeamMember } from '@/components/dataTable/data/schema'

export function useTeam() {
  const { selectedWorkspaceId } = useWorkspace()
  const route = useRoute()

  // dérive l'ID de l'équipe depuis l'URL
  const selectedTeamId = computed<string | null>(() => {
    const t = route.params.teamId
    return t && t !== 'undefined' ? String(t) : null
  })

  const queryClient = useQueryClient()

  // — LIST —
  const {
    data: teams,
    isLoading: isLoadingTeams,
    isFetched: isTeamsFetched,
  } = useQuery<Team[]>({
    queryKey: computed(() => ['teams', selectedWorkspaceId.value]),
    queryFn: async () => {
      const headers = useRequestHeaders(['cookie']) as HeadersInit
      return await $fetch<Team[]>('/api/teams/list', {
        method: 'GET',
        headers,
        query: { workspaceId: selectedWorkspaceId.value }
      })
    },
    enabled: computed(() => !!selectedWorkspaceId.value),
  })

  // — READ SELECTED —
  const {
    data: selectedTeam,
    isLoading: isLoadingSelectedTeam,
  } = useQuery<Team>({
    queryKey: computed(() => ['team', selectedTeamId.value]),
    queryFn: async ({ queryKey }) => {
      const [, id] = queryKey
      return await $fetch<Team>('/api/teams/read', {
        method: 'GET',
        query: { id }
      })
    },
    enabled: computed(() => !!selectedTeamId.value),
    placeholderData: (prev) => prev ?? undefined,
  })

  // — CREATE —
  const createTeamMutation = useMutation({
    mutationFn: async (payload: Partial<Team>) =>
      await $fetch<Team>('/api/teams/create', {
        method: 'POST',
        body: { ...payload, workspaceId: selectedWorkspaceId.value }
      }),
    onSuccess: () => queryClient.invalidateQueries(['teams']),
  })
  const createTeam = (data: Partial<Team>) => createTeamMutation.mutateAsync(data)

  // — UPDATE —
  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Team> }) =>
      await $fetch<Team>('/api/teams/update', {
        method: 'PUT',
        query: { id },
        body: data
      }),
    onSuccess: () => queryClient.invalidateQueries(['teams']),
  })
  const updateTeam = (id: string, data: Partial<Team>) =>
    updateTeamMutation.mutateAsync({ id, data })

  // — DELETE —
  const deleteTeamMutation = useMutation({
    mutationFn: async (id: Number) =>
      await $fetch('/api/teams/delete', {
        method: 'DELETE',
        query: { id }
      }),
    onSuccess: () => queryClient.invalidateQueries(['teams']),
  })
  const deleteTeam = (id: Number) => deleteTeamMutation.mutateAsync(id)

  // — ASSIGN MEMBERS —
  const assignMembersMutation = useMutation({
    mutationFn: async ({ teamId, assignments }: { teamId: string; assignments: TeamMember[] }) =>
      await $fetch<Team>('/api/teams/assign', {
        method: 'POST',
        query: { id: teamId },
        body: { assignments }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['team', selectedTeamId.value])
      queryClient.invalidateQueries(['teams', selectedWorkspaceId.value])
    },
  })
  const assignMembers = (teamId: string, assignments: TeamMember[]) =>
    assignMembersMutation.mutateAsync({ teamId, assignments })


  // — RENAME THE TEAM —
  const renametTeamMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      await $fetch('/api/teams/rename', { method: 'PUT', query: { id }, body: data }),
    onSuccess: () => queryClient.invalidateQueries(['models']),
  })
  const renameTeam = (id: number, updatedData: any) =>
    renametTeamMutation.mutateAsync({ id, data: updatedData })

  return {
    // state & queries
    teams,
    isLoadingTeams,
    isTeamsFetched,

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
