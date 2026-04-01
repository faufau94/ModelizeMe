<template>
  <div class="px-6 py-6 lg:px-8">
    <Model :models="models"/>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'sidebar',
})

import { useModel } from "@/composables/api/useModel"

const { models } = useModel()
</script>