<script setup>
import {Background} from '@vue-flow/background'
</script>

<template>
  <div class="dropzone-background">
    <Background :size="6" :gap="20" pattern-color="transparent" />
    <div class="overlay">
      <slot />
    </div>
  </div>
</template>
