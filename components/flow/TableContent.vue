<template>
  <p class="font-bold text-2xl">Entité</p>
  <div class="max-w-sm mt-6">
    <label for="input-label" class="block text-sm font-medium mb-2 dark:text-white">Nom de l'entité</label>
    <input v-model="nodeName" @input="updateNode" type="text"
           class="peer py-3 px-4 ps-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
           placeholder="">
  </div>

  <p class="font-bold text-xl mt-10">Champs</p>
  <div class="max-w-sm mt-6">
    <div class="sm:inline-flex sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full"
         v-for="(field, index) in nodeData?.data?.properties">
      <input
          v-model="field.propertyName"
          type="email" id="inline-input-label-with-helper-text"
          class="max-w-xs py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
          placeholder="Nom du champ" aria-describedby="hs-inline-input-helper-text">

      <div class="relative" data-hs-combo-box="">
        <div class="relative">
          <input
              v-model="field.typeName"
              class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
              type="text" data-hs-combo-box-input="">
          <div class="absolute top-1/2 end-3 -translate-y-1/2" data-hs-combo-box-toggle="">
            <svg class="flex-shrink-0 size-3.5 text-gray-500 dark:text-neutral-500"
                 xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m7 15 5 5 5-5"></path>
              <path d="m7 9 5-5 5 5"></path>
            </svg>
          </div>
        </div>
        <div
            class="absolute z-50 w-full max-h-72 p-1 bg-white border border-gray-200 rounded-lg overflow-hidden overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500 dark:bg-neutral-900 dark:border-neutral-700"
            style="display: none;" data-hs-combo-box-output="">
          <div
              class="cursor-pointer py-2 px-4 w-full text-sm text-gray-800 hover:bg-gray-100 rounded-lg focus:outline-none focus:bg-gray-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-200 dark:focus:bg-neutral-800"
              tabindex="0" data-hs-combo-box-output-item="">
            <div class="flex justify-between items-center w-full">
              <span data-hs-combo-box-search-text="Argentina" data-hs-combo-box-value="">Argentina</span>
              <span class="hidden hs-combo-box-selected:block">
          <svg class="flex-shrink-0 size-3.5 text-blue-600 dark:text-blue-500" xmlns="http://www.w3.org/2000/svg"
               width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
        </span>
            </div>
          </div>
          <div
              class="cursor-pointer py-2 px-4 w-full text-sm text-gray-800 hover:bg-gray-100 rounded-lg focus:outline-none focus:bg-gray-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-200 dark:focus:bg-neutral-800"
              tabindex="1" data-hs-combo-box-output-item="">
            <div class="flex justify-between items-center w-full">
              <span data-hs-combo-box-search-text="Brazil" data-hs-combo-box-value="">Brazil</span>
              <span class="hidden hs-combo-box-selected:block">
          <svg class="flex-shrink-0 size-3.5 text-blue-600 dark:text-blue-500" xmlns="http://www.w3.org/2000/svg"
               width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
        </span>
            </div>
          </div>
          <div
              class="cursor-pointer py-2 px-4 w-full text-sm text-gray-800 hover:bg-gray-100 rounded-lg focus:outline-none focus:bg-gray-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-200 dark:focus:bg-neutral-800"
              tabindex="2" data-hs-combo-box-output-item="">
            <div class="flex justify-between items-center w-full">
              <span data-hs-combo-box-search-text="China" data-hs-combo-box-value="">China</span>
              <span class="hidden hs-combo-box-selected:block">
          <svg class="flex-shrink-0 size-3.5 text-blue-600 dark:text-blue-500" xmlns="http://www.w3.org/2000/svg"
               width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
        </span>
            </div>
          </div>
          <div
              class="cursor-pointer py-2 px-4 w-full text-sm text-gray-800 hover:bg-gray-100 rounded-lg focus:outline-none focus:bg-gray-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-200 dark:focus:bg-neutral-800"
              tabindex="3" data-hs-combo-box-output-item="">
            <div class="flex justify-between items-center w-full">
              <span data-hs-combo-box-search-text="USA" data-hs-combo-box-value="">USA</span>
              <span class="hidden hs-combo-box-selected:block">
          <svg class="flex-shrink-0 size-3.5 text-blue-600 dark:text-blue-500" xmlns="http://www.w3.org/2000/svg"
               width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
        </span>
            </div>
          </div>
          <div
              class="cursor-pointer py-2 px-4 w-full text-sm text-gray-800 hover:bg-gray-100 rounded-lg focus:outline-none focus:bg-gray-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-200 dark:focus:bg-neutral-800"
              tabindex="3" data-hs-combo-box-output-item="">
            <div class="flex justify-between items-center w-full">
              <span data-hs-combo-box-search-text="Italy" data-hs-combo-box-value="">Italy</span>
              <span class="hidden hs-combo-box-selected:block">
          <svg class="flex-shrink-0 size-3.5 text-blue-600 dark:text-blue-500" xmlns="http://www.w3.org/2000/svg"
               width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
        </span>
            </div>
          </div>
          <div
              class="cursor-pointer py-2 px-4 w-full text-sm text-gray-800 hover:bg-gray-100 rounded-lg focus:outline-none focus:bg-gray-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-200 dark:focus:bg-neutral-800"
              tabindex="3" data-hs-combo-box-output-item="">
            <div class="flex justify-between items-center w-full">
              <span data-hs-combo-box-search-text="France" data-hs-combo-box-value="">France</span>
              <span class="hidden hs-combo-box-selected:block">
          <svg class="flex-shrink-0 size-3.5 text-blue-600 dark:text-blue-500" xmlns="http://www.w3.org/2000/svg"
               width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
        </span>
            </div>
          </div>
        </div>
      </div>

      <div @click="removeField(index)">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="#ff0000" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"
             class="lucide lucide-trash-2 cursor-pointer">
          <path d="M3 6h18"/>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          <line x1="10" x2="10" y1="11" y2="17"/>
          <line x1="14" x2="14" y1="11" y2="17"/>
        </svg>
      </div>
    </div>

    <div class="flex justify-end items-center mt-3">
      <button type="button"
              @click="addField"
              class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800">
        Ajouter un champs
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="#000"
             stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus">
          <path d="M5 12h14"/>
          <path d="M12 5v14"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>

defineProps({
  nodeData: Object,
  nodeName: String,
  updateNode: Function,
  addField: Function,
  removeField: Function
})
</script>