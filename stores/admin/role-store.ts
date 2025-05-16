import { defineStore } from 'pinia'
import { useQuery} from '@tanstack/vue-query'
import { computed } from 'vue'
import type { Role } from '~/components/dataTable/data/schema'

export const useRoleStore = defineStore('role', () => {

  // 1) Crée la query, mais désactivée par défaut
  const query = useQuery({
    queryKey: ['roles'],
    queryFn: () => $fetch<Role[]>('/api/admin/roles/list'),
    enabled: false,
    staleTime: 0,
  })

  // 2) Méthode pour déclencher le fetch
  function fetchRoles() {
    return query.refetch()
  }

  // 3) Expose un tableau + l'état de chargement
  const roles = computed(() => query.data.value ?? [])
  const isFetching = computed(() => query.isFetching.value)

  return { roles, isFetching, fetchRoles }
})
