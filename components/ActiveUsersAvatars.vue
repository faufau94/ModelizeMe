<template>
  <div class="flex items-center">
    <!-- Afficher les 3 premiers utilisateurs avec overlap -->
    <div class="flex items-center -space-x-2">
      <TooltipProvider v-for="(user, index) in visibleUsers" :key="user.id">
        <Tooltip>
          <TooltipTrigger as-child>
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-transform hover:scale-110 hover:z-50 border-2 border-white shadow-sm cursor-pointer bg-accent text-black"
              :class="{
                'ring-2 ring-blue-500': user.isLocal
              }"
              :style="{
                zIndex: index + 1
              }"
            >
              {{ getInitial(user.name) }}
            </div>
          </TooltipTrigger>
          <TooltipContent class="bg-black text-white">
            <p>{{ user.name }}{{ user.isLocal ? ' (vous)' : '' }}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <!-- Afficher le compteur "+X" s'il y a plus de 3 utilisateurs -->
    <Popover v-if="hasMoreUsers">
      <PopoverTrigger as-child>
        <Button
          variant="ghost"
          size="sm"
          class="w-8 h-8 rounded-full p-0 bg-accent hover:bg-gray-300 text-black text-xs font-medium border-2 border-white shadow-sm transition-all hover:scale-110 -ml-2"
          :style="{ zIndex: visibleUsers.length + 1 }"
        >
          +{{ remainingCount }}
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-64 p-3" align="end">
        <div class="space-y-2">
          <h4 class="font-medium text-sm text-gray-900 mb-3">Tous les utilisateurs ({{ activeUsers.length }})</h4>
          <div class="space-y-1 max-h-64 overflow-y-auto">
            <div
              v-for="user in activeUsers"
              :key="user.id"
              class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
              :class="{ 'bg-blue-50': user.isLocal }"
            >
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 border-2 border-white shadow-sm bg-accent text-black"
              >
                {{ getInitial(user.name) }}
              </div>
              <span class="text-sm text-gray-800 font-medium truncate flex-1">{{ user.name }}</span>
              <span v-if="user.isLocal" class="text-xs text-blue-600 font-medium">Vous</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

const props = defineProps({
  activeUsers: {
    type: Array,
    default: () => []
  },
  maxVisible: {
    type: Number,
    default: 3
  }
})

// Afficher les 3 premiers utilisateurs
const visibleUsers = computed(() => {
  return props.activeUsers.slice(0, props.maxVisible)
})

// Vérifier s'il y a plus d'utilisateurs
const hasMoreUsers = computed(() => {
  return props.activeUsers.length > props.maxVisible
})

// Nombre d'utilisateurs restants
const remainingCount = computed(() => {
  return props.activeUsers.length - props.maxVisible
})

// Obtenir la première lettre du nom
const getInitial = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// Déterminer la couleur du texte en fonction de la luminosité du fond
const getTextColor = (bgColor) => {
  if (!bgColor) return '#ffffff'

  // Convertir la couleur hex en RGB
  const hex = bgColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // Calculer la luminosité
  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  // Retourner blanc ou noir selon la luminosité
  return brightness > 128 ? '#000000' : '#ffffff'
}
</script>
