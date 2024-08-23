<template>
  {{ route.params.idModel }}
</template>

<script setup>
const route = useRoute()

console.log(route.params)

</script>