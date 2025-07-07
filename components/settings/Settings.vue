<template>
  <AlertDialog>
    <AlertDialogTrigger as-child>
        <div @click.stop="showDialogSettings = true">
          Paramètres
        </div>
        
    </AlertDialogTrigger>
    <AlertDialogContent v-if="showDialogSettings" class="max-w-4xl h-[80vh] p-0 overflow-hidden">
      <!-- <AlertDialogHeader class="px-6 py-4 border-b">
        <AlertDialogTitle class="flex items-center gap-2">
          <Settings class="h-5 w-5" />
          Settings
        </AlertDialogTitle>
      </AlertDialogHeader> -->
      <!-- <div class="flex h-full overflow-hidden"> -->
        <!-- Custom sidebar -->
        <!-- <div class="w-64 border-r bg-sidebar flex flex-col">
          <div class="p-4">
            <h3 class="text-sm font-medium text-sidebar-foreground mb-2">General</h3>
            <SidebarNav
              v-model:activeSection="activeSection"
            />
          </div>
        </div> -->
        <!-- Main content area -->
        <div class="flex-1 overflow-auto bg-background">
          <component :is="currentContent" />
        </div>
      <!-- </div> -->
      <AlertDialogFooter class="px-6 py-4 border-t flex justify-end gap-2">
        <AlertDialogCancel>
          Close
        </AlertDialogCancel>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { Settings } from 'lucide-vue-next'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogCancel
} from '@/components/ui/alert-dialog'
import SidebarNav from './components/SidebarNav.vue'

const activeSection = ref('profile')
const showDialogSettings = ref(false)

// Provide activeSection to all nested components
provide('activeSection', activeSection)

// Import the settings components
import Account from './Account.vue'
import Notifications from './Notifications.vue'
import Appearance from './Appearance.vue'
import Display from './Display.vue'

const currentContent = computed(() => {
  switch (activeSection.value) {
    case 'profile':
      return Account
    case 'notifications':
      return Notifications
    case 'appearance':
      return Appearance
    case 'security':
      return Display
    default:
      return Account
  }
})
</script>