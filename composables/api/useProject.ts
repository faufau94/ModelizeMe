import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useWorkspace } from '@/composables/api/useWorkspace'

export interface GeneratedProject {
  id: string
  name: string
  generatedName: string
  description?: string
  framework: string
  orm: string
  database: string
  modelId: string
  workspaceId: string
  authorId?: string
  createdAt: string
  updatedAt: string
  model?: { id: string; name: string }
  author?: { name: string; image?: string }
}

export const useProject = () => {
  const { selectedWorkspaceId } = useWorkspace()
  const queryClient = useQueryClient()

  // - LIST -
  const { data: projects, isLoading: isLoadingProjects, isFetched: isProjectsFetched } = useQuery<GeneratedProject[]>({
    queryKey: computed(() => ['projects', selectedWorkspaceId.value]),
    queryFn: async () => {
      return await $fetch<GeneratedProject[]>('/api/projects/list', {
        method: 'GET',
        query: { workspaceId: selectedWorkspaceId.value },
      })
    },
    enabled: computed(() => selectedWorkspaceId.value !== null),
  })

  // - CREATE -
  const createProjectMutation = useMutation({
    mutationFn: async (payload: Omit<GeneratedProject, 'id' | 'createdAt' | 'updatedAt' | 'model' | 'author'>) =>
      await $fetch<GeneratedProject>('/api/projects/create', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  // - DELETE -
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) =>
      await $fetch('/api/projects/delete', {
        method: 'DELETE',
        query: { id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  return {
    projects,
    isLoadingProjects,
    isProjectsFetched,
    createProject: createProjectMutation.mutateAsync,
    deleteProject: deleteProjectMutation.mutateAsync,
    isDeletingProject: computed(() => deleteProjectMutation.isPending.value),
  }
}
