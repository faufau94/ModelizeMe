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
      console.log('Using workspaceId from route:', route.params.workspaceId)
      return String(route.params.workspaceId)
    }

    console.log('Using lastActiveWorkspaceId from session:', data.value?.user?.lastActiveWorkspaceId)
    // sinon, on tombe sur la valeur stockée en session
    return data.value?.user?.lastActiveWorkspaceId ?? null
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

    // 3) naviguer vers la nouvelle route
    await navigateTo(`/app/workspace/${workspaceId}/dashboard`)
  }

  
  return {
    // mutations
    addWorkspace,
    editWorkspace,
    deleteWorkspace,
    switchWorkspace,

    // list
    workspaces,
    isLoadingWorkspaces,

    // selected
    selectedWorkspaceId,
    selectedWorkspace,
    isLoadingSelectedWorkspace,
  }
}