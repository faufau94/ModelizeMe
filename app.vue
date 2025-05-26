<script setup lang="ts">
import { Toaster } from '@/components/ui/toast'
</script>

<template>
  <ClientOnly>
    <Toaster />
  </ClientOnly>

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>