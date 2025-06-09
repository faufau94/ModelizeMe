<script setup lang="ts">
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Settings 
} from 'lucide-vue-next'

interface Item {
  title: string,
  icon: any,
  id: string,
}

defineProps<{
  activeSection: string
}>()

const emit = defineEmits<{
  (e: 'update:activeSection', value: string): void
}>()

const settingsItems : Item[] = [
  { title: 'Account', icon: User, id: 'profile' },
  { title: 'Notifications', icon: Bell, id: 'notifications' },
  { title: 'Appearance', icon: Palette, id: 'appearance' },
  { title: 'Display', icon: Shield, id: 'security' },
]
</script>

<template>
  <nav class="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
    <Button
      v-for="item in settingsItems"
      :key="item.id"
      variant="ghost"
      :class="cn(
        'w-full text-left justify-start flex items-center gap-2',
        activeSection === item.id && 'bg-muted hover:bg-muted'
      )"
      @click="emit('update:activeSection', item.id)"
    >
      <component :is="item.icon" class="h-4 w-4" />
      {{ item.title }}
    </Button>
  </nav>
</template>
