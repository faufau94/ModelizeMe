<template>
  <div class="p-4">
    <div class="bg-white border border-gray-300 w-96 h-auto rounded-lg p-4 m-4">
      <input
          class="text-center w-full mb-2 border-0"
          placeholder="Entity Name"
          :value="props.data.name"
          type="text"
          maxlength="20"
          readonly
      />
      <hr class="my-2" />

      <div v-for="(input, index) in props.data.properties" :key="index" class="flex items-center justify-around mb-2">
        <div v-if="index != 0">

        </div>
        <div v-else class="flex items-center">
          <i class="fas fa-key text-red-500"></i>
        </div>
        <div class="flex-1">
          <input
              class="text-center w-full"
              placeholder="Property Name"
              v-model="input['propertyName']"
              type="text"
              maxlength="20"
              :class="{'text-red-500': index === 0}"
              :style="{textDecoration: index === 0 ? 'underline' : 'none'}"
              readonly
          />
        </div>
        <div class="flex-1">
          <input
              class="text-center w-full"
              placeholder="Name Type"
              v-model="input['typeName']"
              type="text"
              maxlength="20"
              :class="{'text-red-500': index === 0}"
              :style="{textDecoration: index === 0 ? 'underline' : 'none'}"
              readonly
          />
        </div>
      </div>
    </div>
  </div>
</template>


<script lang="ts" setup>

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
})
</script>
