<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import {
  RadioGroupIndicator,
  RadioGroupItem,
  type RadioGroupItemProps,
  useForwardProps,
} from 'radix-vue'
import { Circle } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<RadioGroupItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <RadioGroupItem
    v-bind="forwardedProps"
    :class="
      cn(
        'aspect-square h-4 w-4 rounded-full border border-input text-foreground ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:text-primary',
        props.class,
      )
    "
  >
    <RadioGroupIndicator
      class="flex items-center justify-center"
    >
      <Circle class="h-2.5 w-2.5 fill-current text-current" />
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>
