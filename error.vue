<template>
    <div class="min-h-screen flex items-center justify-center bg-background p-4">
      <div class="text-center space-y-6 max-w-md">
        <!-- 404 Number -->
        <h1 class="text-8xl font-bold text-muted-foreground">404</h1>
        
        <!-- Message -->
        <div class="space-y-2">
          <h2 class="text-2xl font-semibold text-foreground">Page not found</h2>
          <p class="text-muted-foreground">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        
        <!-- Action Button -->
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
  const goHome = async () => {
    await navigateTo('/')
  }
  </script>