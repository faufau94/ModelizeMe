<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <div class="w-full max-w-md">
      <div class="relative h-32">
        <transition name="fade-slide" mode="out-in">
          <div :key="currentStep" class="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div class="flex items-center gap-2 mb-2">
              <Loader2 class="w-5 h-5 animate-spin text-primary"/>
              <h2 class="text-lg font-semibold">{{ steps[currentStep].title }}</h2>
            </div>
            <p class="text-sm text-muted-foreground">{{ steps[currentStep].description }}</p>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted, onUnmounted} from 'vue'
import {Loader2} from 'lucide-vue-next'

const steps = [
  {title: "Initialisation du dépôt", description: "Création de la structure du projet..."},
  {title: "Configuration", description: "Ajout des fichiers de configuration..."},
  {title: "Envoi des fichiers", description: "Push du code source vers le dépôt..."},
  {title: "Finalisation", description: "Vérification et nettoyage..."},
]

const currentStep = ref(0)
let timer

onMounted(() => {
  timer = setInterval(() => {
    currentStep.value = (currentStep.value + 1) % steps.length
  }, 3000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
