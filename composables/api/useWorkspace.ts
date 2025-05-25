// ~/composables/useWorkspace.ts
import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Workspace } from '@/components/dataTable/data/schema'

export const useWorkspace = () => {
  const route = useRoute()
  const { data } = useAuth()
  const { refresh } = useAuth()
  const queryClient = useQueryClient()

  const selectedWorkspaceId = computed<string|null>(() => {
    // si l’URL fournit workspaceId, on l’utilise
    if (route.params.workspaceId !== 'undefined') {
      return String(route.params.workspaceId)
    }

    // sinon, on tombe sur la valeur stockée en session
    return data.value?.user?.lastActiveWorkspaceId ?? null
  })

  const workspaceShareLink = computed(() => {
    if (!selectedWorkspaceId.value) return ''
    return `${useRuntimeConfig().public.baseUrl}/app/workspace/${selectedWorkspaceId.value}/join/${selectedWorkspace.value?.inviteCode}`
  })
  

  // — LIST —
  const {data: workspaces, isLoading: isLoadingWorkspaces, error, suspense } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const headers = useRequestHeaders(['cookie']) as HeadersInit
      const res = await $fetch<Workspace[]>('/api/workspaces/list', {
        method: 'GET',
        headers
      })
      return res
    },
    })

  // — READ SELECTED —
  const {data: selectedWorkspace, isLoading: isLoadingSelectedWorkspace } = useQuery<Workspace>({
    queryKey: computed(() => ['workspace', selectedWorkspaceId.value]),
    queryFn: async ({ queryKey }) => {

      const workspaceId = route.params.workspaceId

      const headers = useRequestHeaders(['cookie']) as HeadersInit      
      return await $fetch<Workspace>('/api/workspaces/read', {
        method: 'GET',
        query: { workspaceId },
        headers
      })
    },
    staleTime: 0,
    enabled: computed(() => selectedWorkspaceId.value !== null),
  })

  // — CREATE —
  const addWorkspaceMutation = useMutation({
    mutationFn: async (payload: any) =>
      await $fetch('/api/workspaces/create', { method: 'POST', body: payload }),
    onSuccess: () => queryClient.invalidateQueries(['workspaces']),
  })
  function addWorkspace(newWorkspace: any) {
    return addWorkspaceMutation.mutateAsync(newWorkspace)
  } 

  // — EDIT —
  const editWorkspaceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      await $fetch('/api/workspaces/edit', { method: 'PUT', query: { id }, body: data }),
    onSuccess: () => queryClient.invalidateQueries(['workspaces']),
  })
  const editWorkspace = (id: number, updatedData: any) =>
    editWorkspaceMutation.mutateAsync({ id, data: updatedData })

  // — DELETE —
  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (id: string) =>
      await $fetch('/api/workspaces/delete', { method: 'DELETE', query: { id } }),
    onSuccess: () => queryClient.invalidateQueries(['workspaces']),
  })
  const deleteWorkspace = (id: string) => deleteWorkspaceMutation.mutateAsync(id)

  // — SWITCH WORKSPACE —
  async function switchWorkspace(workspaceId: string) {
    if (workspaceId === selectedWorkspaceId.value) return

    // 1) update lastActiveWorkspaceId en base
    await $fetch('/api/workspaces/last-active-workspace', {
      method: 'PUT',
      query: { workspaceId },
    })

    // 2) rafraîchir la session Auth.js pour récupérer le nouveau lastActiveWorkspaceId
    await refresh()

    // 3) mettre à jour le cache model
    queryClient.invalidateQueries(['models', selectedWorkspaceId.value])

    // 3) naviguer vers la nouvelle route
    await navigateTo(`/app/workspace/${workspaceId}/dashboard`)
  }

  // — JOIN WORKSPACE —
  const joinWorkspace = async (workspaceId: string, inviteCode: string) => {
    const headers = useRequestHeaders(['cookie']) as HeadersInit
    const res = await $fetch('/api/workspaces/join', {
      method: 'POST',
      query: { workspaceId, inviteCode },
      headers,
    })

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

    await refresh()

    await navigateTo(`/app/workspace/${workspaceId}/dashboard`)
  }

  // — REGENERATE WORKSPACE INVITE CODE —
  const regenerateWorkspaceInviteCode = async () => {
    const headers = useRequestHeaders(['cookie']) as HeadersInit
    await $fetch<string>('/api/workspaces/regenerate-invite-code', {
      method: 'PUT',
      query: { workspaceId: selectedWorkspaceId.value },
      headers,
    })

    await queryClient.invalidateQueries(['workspace', selectedWorkspaceId.value])
  }
    

  // — COPY WORKSPACE LINK —
  const copyWorkspaceLink = async () => {
    await navigator.clipboard.writeText(workspaceShareLink.value)
  }

  // — Go to Workspace URL —
  const goToThisWorkspaceUrl = (addToUrl: string) => {
    return `/app/workspace/${selectedWorkspaceId.value}/${addToUrl}`
  }

  
  return {
    // mutations
    addWorkspace,
    editWorkspace,
    deleteWorkspace,
    switchWorkspace,
    joinWorkspace,
    copyWorkspaceLink,
    goToThisWorkspaceUrl,
    regenerateWorkspaceInviteCode,

    workspaces,
    isLoadingWorkspaces,
    selectedWorkspaceId,
    selectedWorkspace,
    isLoadingSelectedWorkspace,
    workspaceShareLink,
  }
}