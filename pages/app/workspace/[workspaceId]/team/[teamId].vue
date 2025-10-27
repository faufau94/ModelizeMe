<template>
    <Models :models="models"/>
</template>

<script setup>
definePageMeta({
  layout: 'sidebar',
})

import {useModel} from "@/composables/api/useModel"

const { models } = useModel()

</script>