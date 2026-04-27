<template>
  <div class="py-6 px-1">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-lg mb-2 font-semibold">Packages (optionnel)</h2>
      <p class="text-sm text-muted-foreground mb-5">Sélectionnez les packages à intégrer dans votre projet.</p>

      <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <label v-for="pkg in packages" :key="pkg.value" class="h-full cursor-pointer">
          <div
              class="border rounded-xl relative transition-all duration-150 bg-white dark:bg-card shadow-sm h-full"
              :class="[
                isSelected(pkg.value)
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/40 hover:shadow-md',
              ]"
              @click="toggle(pkg.value)"
          >
            <div class="p-5">
              <div class="flex items-start justify-between gap-x-3">
                <div class="flex gap-x-3 items-start">
                  <Avatar class="h-10 w-10 shrink-0 bg-background border">
                    <AvatarImage class="p-1.5" :src="`/logos/${pkg.logoName}.svg`" :alt="pkg.name"/>
                    <AvatarFallback>{{ pkg.name.charAt(0).toUpperCase() }}</AvatarFallback>
                  </Avatar>

                  <div class="min-w-0">
                    <h3 class="text-sm font-semibold">{{ pkg.name }}</h3>
                    <p class="text-muted-foreground text-sm mt-1.5 leading-relaxed">{{ pkg.description }}</p>
                  </div>
                </div>

                <Checkbox :checked="isSelected(pkg.value)" class="shrink-0 mt-0.5"/>
              </div>
            </div>
          </div>
        </label>
      </div>

      <p v-if="packages.length === 0" class="text-sm text-muted-foreground text-center py-8">
        Aucun package disponible pour ce framework.
      </p>
    </div>
  </div>
</template>

<script setup>
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Checkbox} from '@/components/ui/checkbox'

const props = defineProps({
  packages: { type: Array, required: true },
})

const selected = defineModel({ type: Array, default: () => [] })

function isSelected(value) {
  return selected.value.includes(value)
}

function toggle(value) {
  if (isSelected(value)) {
    selected.value = selected.value.filter(v => v !== value)
  } else {
    selected.value = [...selected.value, value]
  }
}
</script>
