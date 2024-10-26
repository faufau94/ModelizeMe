<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md">
      <div class="relative h-40">
        <transition
            name="fade-slide"
            mode="out-in"
        >
          <div
              :key="currentStep"
              class="absolute inset-0 flex flex-col items-center justify-center text-center"
          >
            <div class="flex items-center mb-2">
              <div class="loader mr-2"></div>
              <h2 class="text-xl font-bold text-gray-800">{{ steps[currentStep].title }}</h2>
            </div>
            <p class="text-gray-600">{{ steps[currentStep].description }}</p>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const steps = [
  { title: "Étape 1", description: "Commencez votre voyage" },
  { title: "Étape 2", description: "Apprenez les bases" },
  { title: "Étape 3", description: "Appliquez vos connaissances" },
  { title: "Étape 4", description: "Pratiquez et affinez" },
  { title: "Étape 5", description: "Maîtrisez la compétence" },
]

const currentStep = ref(0)
let timer

const nextStep = () => {
  currentStep.value = (currentStep.value + 1) % steps.length
}

onMounted(() => {
  timer = setInterval(nextStep, 3000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(50px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-50px);
}

.loader {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  color: #1f2937; /* text-gray-800 */
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>