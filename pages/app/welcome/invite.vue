<template>
    invite with join code: {{ joinCode }}
</template>

<script setup>
definePageMeta({
    layout: 'sidebar',
});

const route = useRoute();

const { joinCode } = route.query;

</script>