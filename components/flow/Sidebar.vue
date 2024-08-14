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

    <!-- Sous-menu -->
    <div v-if="isSubMenuVisible"
         :class="subMenuClass"
         class="absolute z-40 w-96 top-0 h-screen flex flex-col transition-all duration-300 justify-between border-e bg-white">

      <div v-if="nodeIdSelected !== null" class="px-5 mt-14">
        <p class="font-bold text-2xl">Entité</p>
        <div class="max-w-sm mt-6">
          <label for="input-label" class="block text-sm font-medium mb-2 dark:text-white">Nom de l'entité</label>
          <input v-model="nodeName" @input="updateNode" type="text"
                 class="peer py-3 px-4 ps-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                 placeholder="">
        </div>

        <p class="font-bold text-xl mt-10">Champs</p>
        <div class="max-w-sm mt-6 space-y-2">
          <div class="sm:inline-flex flex sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full"
               v-for="(field, index) in nodeData?.data?.properties">
            <input
                v-model="field.propertyName"
                type="email"
                class="peer py-3 ps-4 flex-none block bg-gray-100 border-transparent rounded-lg text-sm disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                placeholder="Nom du champ"
            >

            <div class="flex-1">

              <Combobox v-model="field.typeName">
                <div class="relative mt-1 w-full">
                  <div
                      class="relative w-full cursor-default overflow-hidden rounded-md bg-white text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm"
                  >
                    <ComboboxInput
                        class="peer py-3 px-4 ps-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                        :displayValue="(person) => person"
                        @change="query = $event.target.value"
                    />
                    <ComboboxButton
                        class="absolute inset-y-0 right-0 flex items-center pr-2"
                    >
                      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                           stroke-width="1.5" stroke="currentColor" class="h-5 w-5 text-gray-400">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"/>
                      </svg>

                    </ComboboxButton>
                  </div>
                  <TransitionRoot
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                      @after-leave="query = ''"
                  >
                    <ComboboxOptions
                        class="absolute mt-1 max-h-60 z-50 w-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
                    >
                      <div
                          v-if="filteredPeople.length === 0 && query !== ''"
                          class="relative cursor-default select-none px-4 py-2 text-gray-700"
                      >
                        Aucun résultat.
                      </div>

                      <ComboboxOption
                          v-for="(person, index) in filteredPeople"
                          as="template"
                          :key="index"
                          :value="person"
                          v-slot="{ selected, active }"
                      >
                        <li
                            class="relative cursor-default select-none py-2 pl-10 pr-4"
                            :class="{
                  'bg-teal-600 text-white': active,
                  'text-gray-900': !active,
                }"
                        >
                <span
                    class="block truncate"
                    :class="{ 'font-medium': selected, 'font-normal': !selected }"
                >
                  {{ person }}
                </span>
                          <span
                              v-if="selected"
                              class="absolute inset-y-0 left-0 flex items-center pl-3"
                              :class="{ 'text-white': active, 'text-teal-600': !active }"
                          >
                          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                               stroke-width="1.5"
                               stroke="currentColor" class="h-5 w-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                          </svg>

                </span>
                        </li>
                      </ComboboxOption>
                    </ComboboxOptions>
                  </TransitionRoot>
                </div>
              </Combobox>
            </div>


            <div v-if="field?.propertyName !== 'id'" @click="removeField(index)">
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

          <div class="flex justify-end items-center pt-3">
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
      </div>

      <div v-else-if="edgeIdSelected !== null" class="mt-14">
        <div class="px-5 py-5">
          <p class="font-bold text-xl">Cardinalité</p>
          <div class="max-w-sm mt-6 mb-6 flex justify-between items-center">
            <div>

              <label for="hs-select-label" class="block text-center text-md font-medium mb-2 dark:text-white">{{
                  mcdStore.flowMCD.findEdge(edgeIdSelected)?.sourceNode?.data?.name
                }}</label>
              <select v-model="sourceCardinality" id="hs-select-label"
                      class="py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600">
                <option value="" class="text-gray-500">X,X</option>
                <option value="1,N">1,N</option>
                <option value="0,1">0,1</option>
                <option value="1,1">1,1</option>
                <option value="0,N">0,N</option>
              </select>
            </div>
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                   stroke="#595959" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"
                   class="lucide lucide-move-right">
                <path d="M18 8L22 12L18 16"/>
                <path d="M2 12H22"/>
              </svg>
            </div>
            <div>
              <label for="hs-select-label" class="block text-center text-md font-medium mb-2 dark:text-white">{{
                  mcdStore.flowMCD.findEdge(edgeIdSelected)?.targetNode?.data?.name
                }}</label>
              <select v-model="targetCardinality" id="hs-select-label"
                      class="py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600">
                <option value="" class="text-gray-500">X,X</option>
                <option value="1,N">1,N</option>
                <option value="0,1">0,1</option>
                <option value="1,1">1,1</option>
                <option value="0,N">0,N</option>
              </select>
            </div>
          </div>
          <hr>
          <!--
          <div v-if="!hasAnAssociation" class="px-5 mt-20 flex flex-col justify-center items-center">
            <button @click="addAssociation" type="button"
                    class="flex flex-col justify-center items-center p-10 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none"
                   stroke="#2763EB"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus">
                <path d="M5 12h14"/>
                <path d="M12 5v14"/>
              </svg>
              <p class="text-base mt-4 text-md font-semibold text-[#2763EB] dark:text-white">Créer une association</p>
            </button>
          </div>
          -->

          <div class="mt-10">
            <p class="font-bold text-xl">Association</p>
            <div class="max-w-sm mt-6">
              <label for="input-label" class="block text-sm font-medium mb-2 dark:text-white">Nom de
                l'association</label>
              <input :value="mcdStore.flowMCD.findEdge(edgeIdSelected)?.data?.name"
                     @input="event => updateEdgeName(event.target.value)"
                     type="text"
                     class="peer py-3 px-4 ps-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                     placeholder="">
            </div>

            <p class="font-bold text-xl mt-10">Champs</p>
            <div class="max-w-sm mt-6 space-y-2">
              <div class="sm:inline-flex sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full"
                   v-for="(field, index) in mcdStore.flowMCD.findEdge(edgeIdSelected)?.data?.properties">
                <input
                    v-model="field.propertyName"
                    type="email" id=""
                    class="peer py-3 px-4 ps-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                    placeholder="Nom du champ"
                >

                <Combobox v-model="field.typeName">
                  <div class="relative mt-1 w-full">
                    <div
                        class="relative w-full cursor-default overflow-hidden rounded-md bg-white text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm"
                    >
                      <ComboboxInput
                          class="peer py-3 px-4 ps-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                          :displayValue="(person) => person"
                          @change="query = $event.target.value"
                      />
                      <ComboboxButton
                          class="absolute inset-y-0 right-0 flex items-center pr-2"
                      >
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                             stroke-width="1.5" stroke="currentColor" class="h-5 w-5 text-gray-400">
                          <path stroke-linecap="round" stroke-linejoin="round"
                                d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"/>
                        </svg>

                      </ComboboxButton>
                    </div>
                    <TransitionRoot
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        @after-leave="query = ''"
                    >
                      <ComboboxOptions
                          class="absolute mt-1 max-h-60 z-50 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
                      >
                        <div
                            v-if="filteredPeople.length === 0 && query !== ''"
                            class="relative cursor-default select-none px-4 py-2 text-gray-700"
                        >
                          Aucun résultat.
                        </div>

                        <ComboboxOption
                            v-for="(person, index) in filteredPeople"
                            as="template"
                            :key="index"
                            :value="person"
                            v-slot="{ selected, active }"
                        >
                          <li
                              class="relative cursor-default select-none py-2 pl-3 pr-4"
                              :class="{
                  'bg-teal-600 text-white': active,
                  'text-gray-900': !active,
                }"
                          >
                <span
                    class="block truncate"
                    :class="{ 'font-medium': selected, 'font-normal': !selected }"
                >
                  {{ person }}
                </span>
                            <span
                                v-if="selected"
                                class="absolute inset-y-0 left-0 flex items-center pl-3"
                                :class="{ 'text-white': active, 'text-teal-600': !active }"
                            >
                          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                               stroke-width="1.5"
                               stroke="currentColor" class="h-5 w-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                          </svg>

                </span>
                          </li>
                        </ComboboxOption>
                      </ComboboxOptions>
                    </TransitionRoot>
                  </div>
                </Combobox>

                <div @click="removeFieldAssociation(index)">
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

              <div class="flex justify-end items-center pt-3">
                <button type="button"
                        @click="addFieldAssociation"
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
          </div>
        </div>

      </div>
    </div>

    <button @click="elementsMenu = !elementsMenu" type="button"
            class="absolute top-4 right-4 gap-2 flex justify-center items-center size-[53px] text-sm font-semibold rounded-full z-50 border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff"
           stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus">
        <path d="M5 12h14"/>
        <path d="M12 5v14"/>
      </svg>
    </button>

    <div v-if="elementsMenu" class="absolute top-4 right-[90px] z-50 flex flex-col bg-white border border-gray-200 shadow-sm rounded-xl p-2
     w-80 md:p-4 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400">
      <div class="p-2 md:p-4">
        <h4 class="text-lg font-bold text-gray-800 dark:text-white">
          Table
        </h4>
        <button @click="addNode" :draggable="true" @dragstart="onDragStart($event, 'input')" type="button"
                class="p-2 mt-3  sm:p-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-dashed border-zinc-400 bg-white text-white hover:bg-zinc-100 hover:transition hover:duration-150">


          <svg xmlns="http://www.w3.org/2000/svg" width="50px" height="50px" viewBox="0 0 24 24" fill="none"
               stroke="#8392a6" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
               class="lucide lucide-credit-card">
            <rect width="20" height="14" x="2" y="5" rx="2"/>
            <line x1="2" x2="22" y1="10" y2="10"/>
          </svg>
        </button>
      </div>
      <div class="p-2 md:p-4">
        <h4 class="text-lg font-bold text-gray-800 dark:text-white">
          MLD
        </h4>
        <button @click="mldStore.generateMLD()" type="button"
                class="p-2 mt-3  sm:p-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-dashed border-zinc-400 bg-white text-white hover:bg-zinc-100 hover:transition hover:duration-150">
          Générer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, ref, watch, watchEffect} from "vue";
import useDragAndDrop from "~/utils/useDnd.js";
import {useMCDStore} from "~/stores/mcd-store.js";
import {storeToRefs} from "pinia";
import {useNodesData} from "@vue-flow/core";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  TransitionRoot,
} from '@headlessui/vue'
import {useMLDStore} from "~/stores/mld-store.js";

const {onDragStart} = useDragAndDrop()

const mldStore = useMLDStore()
const mcdStore = useMCDStore()
const {addNode} = mcdStore
const {isSubMenuVisible, elementsMenu, nodeIdSelected, edgeIdSelected} = storeToRefs(mcdStore)


mcdStore.flowMCD.onPaneClick((e) => {
  if (isSubMenuVisible.value) isSubMenuVisible.value = false
  elementsMenu.value = false
  nodeIdSelected.value = null
  edgeIdSelected.value = null
})

const nodeData = ref(null);

// watchEffect to update nodeData whenever nodeIdSelected changes
watchEffect(() => {
  nodeData.value = mcdStore.flowMCD.findNode(nodeIdSelected.value);
});

const updateNode = () => {
  mcdStore.flowMCD.updateNodeData(nodeData.value.id, (node) => {
    node.data = nodeData.value.data
  })
}

const updateEdgeName = newName => {
  mcdStore.flowMCD.updateEdgeData(edgeIdSelected.value, {name: newName});
}

const addFieldAssociation = () => {
  mcdStore.flowMCD.updateEdgeData(edgeIdSelected.value, (edge) => {
    edge.data.properties.push({propertyName: '', typeName: ''})
  })
}

const addField = () => {

  mcdStore.flowMCD.updateNodeData(nodeData.value.id, (node) => {
    node.data.properties.push({propertyName: '', typeName: ''})
  })
}

const removeField = id => {

  mcdStore.flowMCD.updateNodeData(nodeData.value.id, (node) => {
    node.data.properties.splice(id, 1)
  })
}

const removeFieldAssociation = id => {
  mcdStore.flowMCD.updateEdgeData(edgeIdSelected.value, (edge) => {
    edge.data.properties.splice(id, 1)
  })
}


const isExpanded = ref(true);

const sidebarClass = computed(() => (isExpanded.value ? "w-56" : "w-16"));
const subMenuClass = computed(() => (isExpanded.value ? "left-56" : "left-16"));
const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value;
};

const submenuDirection = ref('slide-left');

const toggleSubmenu = () => {
  //isSubmenuVisible.value = !isSubmenuVisible.value;
  //submenuDirection.value = isSubmenuVisible.value ? 'slide-right' : 'slide-left';
};



const nodeName = computed({
  get() {
    return nodeData?.value?.data?.name ?? '';
  },
  set(value) {
    if (nodeData && nodeData.value.data) {
      nodeData.value.data.name = value;
    }
  }
});

const sourceCardinality = computed({
  get() {
    return mcdStore.flowMCD.findEdge(edgeIdSelected.value)?.data?.sourceCardinality ?? ''
  },
  set(value) {
    mcdStore.flowMCD.findEdge(edgeIdSelected.value).data.sourceCardinality = value
  }
})

const targetCardinality = computed({
  get() {
    return mcdStore.flowMCD.findEdge(edgeIdSelected.value)?.data?.targetCardinality ?? ''
  },
  set(value) {
    mcdStore.flowMCD.findEdge(edgeIdSelected.value).data.targetCardinality = value
  }
})

//check if an association between two nodes already exists
const hasAnAssociation = computed(() => (
    edgeIdSelected.value !== null && mcdStore.flowMCD.findEdge(edgeIdSelected.value)?.data?.hasNodeAssociation
))


// Combobox
const type = [
  'String',
  'Integer',
  'Big Increment',
  'Boolean',
  'Date',
  'Time',
  'Datetime',
  'Decimal',
  'Double',
  'Float',
  'Long',
  'Text',
  'Timestamp',
  'UUID',
  'Binary',
  'Json',
]

let selected = ref(type[0])
let query = ref('')

let filteredPeople = computed(() =>
    query.value === ''
        ? type
        : type.filter((person) =>
            person
                .toLowerCase()
                .replace(/\s+/g, '')
                .includes(query.value.toLowerCase().replace(/\s+/g, ''))
        )
)

</script>
