<template>
  <div class="flex h-screen">
    <!-- Sidebar principale -->
    <div :class="sidebarClass"
         class="relative flex flex-col justify-between border-e bg-white transition-all duration-300">
      <div class="px-4 py-6" v-if="isExpanded">
        <div class="grid h-10 w-32 place-content-center rounded-lg bg-gray-100 text-xs text-gray-600">
          Logo
        </div>
        <ul class="mt-6 space-y-1">
          <li>
            <a href="#" class="block rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
              Modèles
            </a>
          </li>
          <li>
            <a href="#"
               class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700">
              Générateur de code
            </a>
          </li>
          <li>
            <a href="#"
               class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700">
              Galerie
            </a>
          </li>
          <li>
            <a href="#"
               class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700">
              Paramètres
            </a>
          </li>
        </ul>
      </div>
      <div v-else>
        <div class="inline-flex size-16 items-center justify-center">
          <span class="grid size-10 place-content-center rounded-lg bg-gray-100 text-xs text-gray-600">
            L
          </span>
        </div>
        <div class="border-t border-gray-100">
          <div class="px-2">
            <div class="py-4">
              <a href="#" class="group relative flex justify-center rounded bg-blue-50 px-2 py-1.5 text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="size-5 opacity-75" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span
                    class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
                  Modèles
                </span>
              </a>
            </div>
            <ul class="space-y-1 border-t border-gray-100 pt-4">
              <li>
                <a href="#"
                   class="group relative flex justify-center rounded px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-5 opacity-75" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                  <span
                      class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
                    Galerie
                  </span>
                </a>
              </li>
            </ul>
            <ul class="space-y-1 border-t border-gray-100 pt-4">
              <li>
                <a href="#"
                   class="group relative flex justify-center rounded px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-5 opacity-75" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                  <span
                      class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
                    Générateur de codes
                  </span>
                </a>
              </li>
            </ul>
            <ul class="space-y-1 border-t border-gray-100 pt-4">
              <li>
                <a href="#"
                   class="group relative flex justify-center rounded px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-5 opacity-75" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                  <span
                      class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
                    Paramètres
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <button @click="toggleSidebar"
              class="absolute z-50 top-4 right-0 bg-gray-200 hover:bg-gray-300 transition duration-300 translate-x-6 rounded">
        <svg v-if="isExpanded" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"
             class="lucide lucide-chevrons-left">
          <path d="m11 17-5-5 5-5"/>
          <path d="m18 17-5-5 5-5"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"
             class="lucide lucide-chevrons-right">
          <path d="m6 17 5-5-5-5"/>
          <path d="m13 17 5-5-5-5"/>
        </svg>
      </button>
    </div>

    <slot></slot>

  </div>
</template>

<script setup>
import {computed, ref} from "vue";

const isExpanded = ref(true);
const sidebarClass = computed(() => (isExpanded.value ? "w-56" : "w-16"));
const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value;
};
</script>
