<template>
  <div class="py-6 px-1">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-lg mb-5 font-semibold">Sélectionnez une option</h2>

      <FormField v-slot="{ componentField }" :name="name">
        <FormItem class="space-y-3">
          <FormControl>
            <RadioGroup
                :modelValue="selectedOption"
                @update:modelValue="selectOption"
                v-bind="componentField"
                class="grid gap-4 grid-cols-1 sm:grid-cols-2"
            >
              <label v-for="item in stepDatas.options" :key="item.value">
                <div
                    class="border rounded-xl relative transition-all duration-150 bg-white dark:bg-card shadow-sm"
                    :class="[
                      selectedOption === item.value
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/40 hover:shadow-md',
                      item.comingSoon
                        ? 'opacity-40 cursor-default pointer-events-none'
                        : 'cursor-pointer',
                    ]"
                >
                  <div class="p-5">
                    <div class="flex items-start justify-between gap-x-3">
                      <div class="flex gap-x-3 items-start">
                        <Avatar class="h-10 w-10 shrink-0 bg-background border">
                          <AvatarImage class="p-1.5" :src="`/logos/${item.logoName}.svg`" :alt="item.name"/>
                          <AvatarFallback>{{ item.logoName.charAt(0).toUpperCase() }}</AvatarFallback>
                        </Avatar>

                        <div class="min-w-0">
                          <div class="flex items-center gap-x-2">
                            <h3 class="text-sm font-semibold">{{ item.name }}</h3>
                            <Badge variant="secondary" v-if="item.comingSoon">
                              À venir
                            </Badge>
                          </div>
                          <p class="text-muted-foreground text-sm mt-1.5 leading-relaxed">{{ item.description }}</p>
                        </div>
                      </div>

                      <FormControl>
                        <RadioGroupItem :value="item.value" class="shrink-0 mt-0.5"/>
                      </FormControl>
                    </div>
                  </div>
                </div>
              </label>
            </RadioGroup>
          </FormControl>
          <FormMessage/>
        </FormItem>
      </FormField>
    </div>
  </div>
</template>

<script setup>
import {Badge} from '@/components/ui/badge'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group'
import {FormField, FormItem, FormControl, FormMessage} from '@/components/ui/form'
import {useCodeGeneratorStore} from '@/stores/generator-store.js'

defineProps({
  stepDatas: Object,
  name: String,
})

const codeGeneratorStore = useCodeGeneratorStore()
const {stepIndex, datas} = storeToRefs(codeGeneratorStore)

const selectOption = (value) => {
  switch (stepIndex.value) {
    case 2:
      datas.value.framework = value
      break
    case 3:
      datas.value.orm = value
      break
    case 4:
      datas.value.database = value
      break
  }
}

const selectedOption = computed(() => {
  switch (stepIndex.value) {
    case 2:
      return datas.value.framework
    case 3:
      return datas.value.orm
    case 4:
      return datas.value.database
    default:
      return ''
  }
})
</script>
