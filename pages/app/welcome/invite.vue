<template>
    invite with join code: {{ inviteCode }}
</template>

<script setup>
definePageMeta({
    layout: 'sidebar',
});

const route = useRoute();

const { inviteCode } = route.query;

</script>