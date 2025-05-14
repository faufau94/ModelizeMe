<template>
  <div class="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
    <div class="flex items-center justify-between space-y-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Utilisateurs
        </h2>
        <p class="text-muted-foreground">
          Liste des utilisateurs de l'application.
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <UserNav />
      </div>
    </div>
    <DataTable :data="data" :columns="columns" />
  </div>
</template>
<script setup lang="ts">
import { columns } from '@/components/dataTable/columns'
import DataTable from '@/components/dataTable/DataTable.vue'
import UserNav from '@/components/dataTable/UserNav.vue'

import { useQuery } from '@tanstack/vue-query'

definePageMeta({
    layout: 'sidebar-admin',
});


const data = ref([])
onMounted(async () => {
  const response = await $fetch('/api/admin/users/list')
  data.value = response
})



// const fetcher = async () =>
//   await $fetch('/api/admin/users/list').then((response) =>
//     response.json(),
//   )

// const { data, suspense } = useQuery({ queryKey: ['test'], queryFn: fetcher })

// await suspense()


</script>