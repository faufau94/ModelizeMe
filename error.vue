<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <div class="text-center space-y-6 max-w-md">
      <h1 class="text-8xl font-bold text-muted-foreground">{{ error?.statusCode || 500 }}</h1>

      <div class="space-y-2">
        <h2 class="text-2xl font-semibold text-foreground">
          {{ error?.statusCode === 404 ? 'Page not found' : 'An error occurred' }}
        </h2>
        <p class="text-muted-foreground">
          {{ error?.statusCode === 404
            ? "Sorry, we couldn't find the page you're looking for."
            : (error?.message || 'Something went wrong.') }}
        </p>
      </div>

      <button
        @click="goHome"
        class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2"
      >
        Go back home
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  error: Object
})

const goHome = () => clearError({ redirect: '/' })
</script>