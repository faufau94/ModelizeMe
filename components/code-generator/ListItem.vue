<template>
  <div class="p-6">
    <div class="max-w-6xl">
      <h2 class="text-xl mb-6 font-semibold">Sélectionnez une option</h2>
      <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card
            @click="selectedOption = item.id"
            class="rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-150"
            :class="{ 'border-black bg-gray-50': selectedOption === item.id }"
            v-for="item in items" :key="item.id"
        >
          <CardContent class="p-4">
            <div class="flex items-center gap-x-4">
              <div class="w-12 h-12 px-5 flex items-center justify-center rounded-full bg-gray-100">
                <span class=" font-semibold text-black text-sm ">N</span>
              </div>
              <div>
                <h1 class="text-md font-semibold">Next.js</h1>
                <p class="text-gray-600 text-sm mt-2">Full-featured React framework with great developer experience.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue'

const items = [
  {id: "option1", label: "Option 1"},
  {id: "option2", label: "Option 2"},
  {id: "option3", label: "Option 3"},
  {id: "option4", label: "Option 4"},
  {id: "option5", label: "Option 5"},
  {id: "option6", label: "Option 6"},
]

const selectedOption = ref('option1')
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