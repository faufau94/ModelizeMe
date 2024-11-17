<template>
  <div class="py-6">
    <div class="max-w-6xl">
      <h2 class="text-xl mb-6 font-semibold">Sélectionnez une option</h2>

      <FormField v-slot="{ componentField }" :name="name">
        <FormItem class="space-y-3">

          <FormControl>
            <!-- RadioGroup avec modelValue et update:modelValue pour la sélection -->
            <RadioGroup :modelValue="selectedOption" @update:modelValue="selectOption" v-bind="componentField"
                        class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <!-- Utilisation d'un label pour rendre la carte entière cliquable -->
              <label v-for="item in stepDatas.options" :key="item.id">
                <div
                    class="border rounded-xl relative h-28"
                    :class="[
                    selectedOption === item.value ? 'border-black' : 'border-gray-200',  // Contrôle immédiat de la bordure
                    item.hasOwnProperty('comingSoon') && item.comingSoon
                      ? 'opacity-40 cursor-default pointer-events-none'
                      : 'cursor-pointer hover:bg-gray-50 transition-all duration-150',
                  ]"
                >
                  <div class="p-4">
                    <div class="flex items-start justify-between gap-x-4">
                      <!-- Avatar et contenu principal -->
                      <div class="flex gap-x-4">
                        <Avatar class="h-14 w-14 bg-white border shadow-sm">
                          <AvatarImage class="p-2" :src="`/logos/${item.logoName}.svg`" alt="@radix-vue"/>
                          <AvatarFallback>{{ item.logoName.charAt(0) }}</AvatarFallback>
                        </Avatar>

                        <div>
                          <div class="flex gap-x-4">
                            <h1 class="text-md font-semibold">
                              {{ item.name }}
                            </h1>
                            <Badge
                                variant="secondary"
                                v-if="item.hasOwnProperty('comingSoon') && item.comingSoon"
                            >
                              À venir...
                            </Badge>
                          </div>
                          <p class="text-gray-600 text-sm mt-2">{{ item.description }}</p>
                        </div>
                      </div>

                      <div>
                        <FormControl>
                          <RadioGroupItem :value="item.value"/>
                        </FormControl>
                      </div>
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
import {defineProps, ref} from 'vue'
import {Badge} from '@/components/ui/badge'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group'
import {FormField, FormItem, FormLabel, FormControl, FormMessage} from '@/components/ui/form'
import {useCodeGeneratorStore} from '@/stores/generator-store.js'

defineProps({
  stepDatas: Object,
  name: String,
})

const codeGeneratorStore = useCodeGeneratorStore()
const {stepIndex, datas} = storeToRefs(codeGeneratorStore)

//const selectedOption = ref('')

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
    default:
      break
  }
  selectedOption.value = value
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

<style scoped>
@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>