<template>
  <Transition
      name="drawer"
      @before-enter="preventBodyScroll"
      @after-enter="onDrawerEntered"
      @after-leave="restoreBodyScroll"
  >

    <div v-if="isSubMenuVisible"
         key="submenu"

         class="absolute overflow-hidden z-40 w-full sm:w-[400px] md:w-[570px] px-3 md:px-4 shadow-lg top-0 right-0 h-screen flex flex-col justify-between border-e bg-white"

    >

      <div v-if="nodeIdSelected !== null" class="px-3 md:px-5 py-6 md:py-10 flex flex-col justify-between items-center h-full">
        <div class="w-full">
          <!-- Header bar: title + delete + close -->
          <div class="flex items-center justify-between mb-6">
            <p class="font-bold text-xl">{{ nodeData?.type === 'ternaryEntity' ? 'Association ternaire' : 'Entité' }}</p>
            <div class="flex items-center gap-1">
              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-transparent">
                    <Trash2 :size="16" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer cette entité</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <Button @click="removeNodeById" variant="destructive" class="border-none rounded-sm">
                      Supprimer
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="ghost" size="icon" class="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-transparent" @click="isSubMenuVisible = false">
                <X :size="16" />
              </Button>
            </div>
          </div>
          <div class="max-w-sm">
            <label for="input-label" class="block text-sm font-medium mb-2 dark:text-white">Nom de l'entité</label>
            <Input ref="nodeNameInputRef" v-model="nodeName" type="text"/>
          </div>

          <div class="w-full flex flex-col sm:flex-row items-start sm:items-center justify-start gap-y-2 sm:gap-y-0 gap-x-4 md:gap-x-8">
            <div class="items-top flex gap-x-2 mt-5">
              <Checkbox id="field-timestamp" v-model:checked="nodeTimestamps"/>
              <div class="grid gap-1.5 leading-none">
                <label
                    for="field-timestamp"
                    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Inclure les horodatages
                </label>
              </div>
            </div>

            <div class="items-top flex gap-x-2 mt-5">
              <Checkbox id="field-soft-deletes" v-model:checked="nodeSoftDeletes"/>
              <div class="grid gap-1.5 leading-none">
                <label
                    for="field-soft-deletes"
                    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Inclure le soft-deletes
                </label>
              </div>
            </div>
          </div>


          <div class="flex mt-5 justify-between items-center">

            <div class="font-bold text-xl">Champs</div>
            <div class="flex justify-end items-center">
              <Button variant="outline" @click="addField">
                <CirclePlus :size="20" class="mr-2"/>
                Ajouter un champ
              </Button>
            </div>
          </div>
          <div class="mt-6 space-y-2">
            <ScrollArea ref="scrollAreaRef" class="h-[calc(100vh-400px)] sm:h-[400px] pr-2 md:pr-4">

              <draggable
                  v-if="nodeData && nodeData.data?.properties"
                  v-model="nodeData.data.properties"
                  item-key="id"
                  animation="200"
              >
                <template #item="{element}">

                  <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full">

                    <div class="w-14 h-14 flex justify-center items-center"
                         v-if="!filteredProperty.includes(element.typeName) && element?.typeName !== 'Propriété'">

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <CircleAlert :size="18" class="text-red-500"/>
                          </TooltipTrigger>
                          <TooltipContent class="text-center">
                            Cette propriété n'est pas éligible. <br> Choisissez une propriété valable dans la liste.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div v-else class="w-14 h-14">

                    </div>

                    <div
                        class="w-12 h-9 flex justify-center items-center text-gray-300 hover:bg-gray-50 hover:rounded cursor-pointer">
                      <GripVertical :size="20" class=" group-hover:visible"/>
                    </div>

                    <div class="flex justify-center items-center" :class="[element?.propertyName === 'id' ?
                                    'text-red-500 pointer-events-none ' :
                                    'text-gray-300 cursor-pointer pointer-events-auto']"
                         @click="element.isPrimaryKey = !element.isPrimaryKey">
                      <KeyRound :size="20"
                                :class="[element.isPrimaryKey || element?.propertyName === 'id' ? 'text-red-500' : 'text-gray-300']"/>
                    </div>

                    <div class="w-full p-1">
                      <Input
                          v-model="element.propertyName"
                          type="text"
                          placeholder="Nom du champ"
                          :disabled="element?.propertyName === 'id'"
                      />
                    </div>

                    <div class="w-full">
                      <Popover v-model:open="element.open">
                        <PopoverTrigger as-child>
                          <Button
                              variant="outline"
                              role="combobox"
                              :aria-expanded="element.open"
                              class="w-full justify-between font-normal"
                              :class="[!filteredProperty.includes(element.typeName) && element?.typeName !== 'Propriété' ? 'border-red-500' : '',
                                    element?.typeName === 'Propriété' ? 'text-gray-500 font-normal' : '']"
                              :disabled="element?.propertyName === 'id'"
                          >
                            {{ element.typeName }}
                            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent class="w-full p-0">
                          <Command>
                            <CommandInput class="h-9" placeholder=""/>
                            <CommandEmpty>Aucun résultat.</CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                <CommandItem
                                    v-for="(item, index) in filteredProperty"
                                    :key="index"
                                    :value="item"
                                    @select="(ev) => {
                                    if (typeof ev.detail.value === 'string') {
                                      element.typeName = ev.detail.value
                                    }
                                    element.open = false
                                  }"
                                >
                                  {{ item }}
                                  <Check
                                      :class="{
                                      'ml-auto h-4 w-4': true,
                                      'opacity-100': element.typeName === item,
                                      'opacity-0': element.typeName !== item
                                    }"
                                  />

                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>


                    <div class="w-[15%] h-[15%]" v-if="element?.propertyName !== 'id'">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <NullableIcon class="w-[22px] h-[22px] cursor-pointer"
                                          @click="element.isNullable = !element.isNullable"
                                          :class="[element?.isNullable ?
                                    'text-black' :
                                    'text-gray-400']"
                            />

                          </TooltipTrigger>
                          <TooltipContent class="bg-black text-white">
                            <p>Est Nullable ?</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div v-else class="w-[15%] h-10"></div>

                    <Trash2 class=" w-12 h-12"
                            :class="[element?.propertyName === 'id' ?
                                    'text-gray-300 pointer-events-none invisible' :
                                    'text-red-500 cursor-pointer pointer-events-auto']"
                            @click="removeField(element.id)"/>


                  </div>
                </template>

              </draggable>
            </ScrollArea>


          </div>

          <!-- Advanced actions: loopback edge + ternary relation -->
          <div class="mt-4 pt-4 border-t border-gray-100 w-full">
            <Button
              variant="ghost"
              size="sm"
              class="px-0 h-auto text-xs text-gray-400 hover:text-gray-600 hover:bg-transparent mb-2 gap-1.5"
              @click="showAdvanced = !showAdvanced"
            >
              <ChevronRight
                :class="['w-3 h-3 transition-transform duration-200', showAdvanced ? 'rotate-90' : '']"
              />
              Actions avancées
            </Button>
            <Transition name="add-field">
              <div v-if="showAdvanced" class="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  class="w-full justify-start text-gray-500 border border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50"
                  :class="{ 'opacity-50 cursor-not-allowed': !canAddLoopback }"
                  :disabled="!canAddLoopback"
                  @click="createLoopbackEdge"
                >
                  <svg class="w-4 h-4 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
                    <path d="M14 8 C18 8, 18 14, 14 14" stroke-linecap="round"/>
                    <path d="M14 8 L14 14" />
                    <polyline points="11,12 14,14 14,16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span class="flex-1 text-left">Auto-relation (réflexive)</span>
                  <span v-if="loopbackCount > 0" class="ml-auto inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold min-w-[18px] h-[18px] px-1">
                    {{ loopbackCount }}
                  </span>
                  <span v-if="!canAddLoopback" class="ml-1 text-[10px] text-gray-400">(max)</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="w-full justify-start text-gray-500 border border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50"
                  @click="startTernaryMode"
                >
                  <svg class="w-4 h-4 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
                    <circle cx="10" cy="4" r="2.5"/>
                    <circle cx="3.5" cy="15" r="2.5"/>
                    <circle cx="16.5" cy="15" r="2.5"/>
                    <line x1="10" y1="6.5" x2="5" y2="13"/>
                    <line x1="10" y1="6.5" x2="15" y2="13"/>
                    <line x1="5" y1="13" x2="15" y2="13"/>
                  </svg>
                  <span class="flex-1 text-left">Relation ternaire</span>
                  <span v-if="ternaryCount > 0" class="ml-auto inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold min-w-[18px] h-[18px] px-1">
                    {{ ternaryCount }}
                  </span>
                </Button>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <div v-else-if="edgeIdSelected !== null" class="px-3 md:px-5 py-6 md:py-10 flex flex-col justify-between items-center h-full">

        <div class="w-full">
          <!-- Header bar: title + delete + close -->
          <div class="flex items-center justify-between mb-6">
            <p class="font-bold text-xl">Cardinalité</p>
            <div class="flex items-center gap-1">
              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-transparent">
                    <Trash2 :size="16" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer cette relation</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <Button @click="removeEdgeById" variant="destructive" class="border-none rounded-sm">
                      Supprimer
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="ghost" size="icon" class="h-8 w-8 text-gray-400 hover:text-gray-600" @click="isSubMenuVisible = false">
                <X :size="16" />
              </Button>
            </div>
          </div>
          <div class="mt-6 flex justify-between items-center w-full">
            <div class="w-full">
              <label for="hs-select-label" class="block text-center text-md font-medium mb-2 dark:text-white">{{
                  mcdStore.flowMCD?.findEdge(edgeIdSelected)?.sourceNode?.data?.name?.toUpperCase() ?? ''
                }}</label>
            </div>
            <div class="w-full">

            </div>
            <div class="w-full">
              <label for="hs-select-label" class="block text-center text-md font-medium mb-2 dark:text-white">{{
                  mcdStore.flowMCD?.findEdge(edgeIdSelected)?.targetNode?.data?.name?.toUpperCase() ?? ''
                }}</label>
            </div>
          </div>
          <div class="mb-6 flex justify-between items-center w-full">

            <div class="w-full">
              <Select v-model="sourceCardinality">
                <SelectTrigger>
                  <SelectValue placeholder="X,X"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="1,N">1,N</SelectItem>
                    <SelectItem value="0,1">0,1</SelectItem>
                    <SelectItem value="1,1">1,1</SelectItem>
                    <SelectItem value="0,N">0,N</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div class="w-full flex justify-center items-center">
              <MoveRight :stroke-width="1" :size="24"/>
            </div>
            <div class="w-full">
              <Select v-model="targetCardinality">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="X,X"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="1,N">1,N</SelectItem>
                    <SelectItem value="0,1">0,1</SelectItem>
                    <SelectItem value="1,1">1,1</SelectItem>
                    <SelectItem value="0,N">0,N</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <hr>

          <p class="font-bold text-xl mt-10">Association</p>
          <div class="max-w-sm mt-6">
            <label for="input-label" class="block text-sm font-medium mb-2 dark:text-white">
              Nom de l'association
            </label>
            <Input ref="edgeNameInputRef" v-model="edgeName"
                   type="text"
                   placeholder=""/>
          </div>

          <div v-if="checkIfTwoNRelation" class="w-full flex items-center justify-start gap-x-8">
            <div class="items-top flex gap-x-2 mt-5">
              <Checkbox id="field-timestamp" v-model:checked="edgeTimestamps"/>
              <div class="grid gap-1.5 leading-none">
                <label
                    for="field-timestamp"
                    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Inclure les horodatages
                </label>
              </div>
            </div>

            <div class="items-top flex gap-x-2 mt-5">
              <Checkbox id="field-soft-deletes" v-model:checked="edgeSoftDeletes"/>
              <div class="grid gap-1.5 leading-none">
                <label
                    for="field-soft-deletes"
                    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Inclure le soft-deletes
                </label>
              </div>
            </div>
          </div>

          <div v-if="checkIfTwoNRelation">
            <div class="flex mt-10 justify-between items-center">

              <div class="font-bold text-xl">Champs</div>
              <div class="flex justify-end items-center">
                <Button variant="outline" @click="addFieldAssociation">
                  <CirclePlus :size="20" class="mr-2"/>
                  Ajouter un champ
                </Button>
              </div>
            </div>


            <div class="mt-6 space-y-2">
              <ScrollArea ref="scrollAreaRef" class="h-[calc(100vh-500px)] sm:h-[250px] pr-2 md:pr-4">

                <draggable
                    v-if="edgeData && edgeData.data?.properties"
                    v-model="edgeData.data.properties"
                    item-key="id"
                    animation="200"
                >
                  <template #item="{element}">

                    <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full">

                      <div class="w-14 h-14 flex justify-center items-center"
                           v-if="!filteredProperty.includes(element.typeName) && element?.typeName !== 'Propriété'">

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <CircleAlert :size="18" class="text-red-500"/>
                            </TooltipTrigger>
                            <TooltipContent class="text-center">
                              Cette propriété n'est pas éligible. <br> Choisissez une propriété valable dans la liste.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div v-else class="w-14 h-14">

                      </div>

                      <div
                          class="w-12 h-9 flex justify-center items-center text-gray-300 hover:bg-gray-50 hover:rounded cursor-pointer">
                        <GripVertical :size="20" class=" group-hover:visible"/>
                      </div>

                      <div class="flex justify-center items-center" :class="[element?.propertyName === 'id' ?
                                    'text-red-500 pointer-events-none ' :
                                    'text-gray-300 cursor-pointer pointer-events-auto']"
                           @click="element.isPrimaryKey = !element.isPrimaryKey">
                        <KeyRound :size="20"
                                  :class="[element.isPrimaryKey || element?.propertyName === 'id' ? 'text-red-500' : 'text-gray-300']"/>
                      </div>

                      <div class="w-full p-1">
                        <Input
                            v-model="element.propertyName"
                            type="text"
                            placeholder="Nom du champ"
                            :disabled="element?.propertyName === 'id'"
                        />
                      </div>

                      <div class="w-full">
                        <Popover v-model:open="element.open">
                          <PopoverTrigger as-child>
                            <Button
                                variant="outline"
                                role="combobox"
                                :aria-expanded="element.open"
                                class="w-full justify-between font-normal"
                                :class="[!filteredProperty.includes(element.typeName) && element?.typeName !== 'Propriété' ? 'border-red-500' : '',
                                    element?.typeName === 'Propriété' ? 'text-gray-500 font-normal' : '']"
                                :disabled="element?.propertyName === 'id'"
                            >
                              {{ element.typeName }}
                              <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent class="w-full p-0">
                            <Command>
                              <CommandInput class="h-9" placeholder=""/>
                              <CommandEmpty>Aucun résultat.</CommandEmpty>
                              <CommandList>
                                <CommandGroup>
                                  <CommandItem
                                      v-for="(item, index) in filteredProperty"
                                      :key="index"
                                      :value="item"
                                      @select="(ev) => {
                                    if (typeof ev.detail.value === 'string') {
                                      element.typeName = ev.detail.value
                                    }
                                    element.open = false
                                  }"
                                  >
                                    {{ item }}
                                    <Check
                                        :class="{
                                      'ml-auto h-4 w-4': true,
                                      'opacity-100': element.typeName === item,
                                      'opacity-0': element.typeName !== item
                                    }"
                                    />

                                  </CommandItem>
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <NullableIcon class="w-[22px] h-[22px] cursor-pointer"
                                            @click="element.isNullable = !element.isNullable"
                                            :class="[element?.isNullable ?
                                    'text-black' :
                                    'text-gray-400']"
                              />

                            </TooltipTrigger>
                            <TooltipContent class="bg-black text-white">
                              <p>Est Nullable ?</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>


                      <Trash2 class=" w-12 h-12"
                              :class="[element?.propertyName === 'id' ?
                                    'text-gray-300 pointer-events-none invisible' :
                                    'text-red-500 cursor-pointer pointer-events-auto']"
                              @click="removeFieldAssociation(element.id)"/>

                    </div>
                  </template>

                </draggable>
              </ScrollArea>


            </div>


            <!--
            <div class="mt-6 space-y-2">
              <ScrollArea ref="scrollAreaRef" class="h-[220px] pr-4">
                <TransitionGroup tag="ul" name="fade">
                  <div class="flex flex-col md:flex-row sm:items-center  sm:space-y-0 sm:space-x-3 w-full"
                       v-for="(field, index) in mcdStore.flowMCD.findEdge(edgeIdSelected)?.data?.properties"
                       :key="index">

                    <div class="cursor-pointer" @click="field.isPrimaryKey = !field.isPrimaryKey">
                      <KeyRound :size="20" :class="[field.isPrimaryKey ? 'text-red-500' : 'text-gray-300']"/>
                    </div>

                    <div class="w-full p-1">
                      <Input
                          v-model="field.propertyName"
                          type="text"
                          placeholder="Nom du champ"
                      />
                    </div>

                    <div class=" w-full">
                      <Popover v-model:open="field.open">
                        <PopoverTrigger as-child>
                          <Button
                              variant="outline"
                              role="combobox"
                              :aria-expanded="field.open"
                              class="w-full justify-between"
                              :disabled="field?.propertyName === 'id' && field?.typeName !== 'Propriété'"
                          >
                            {{ field.typeName }}
                            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent class="w-full p-0">
                          <Command>
                            <CommandInput class="h-9" placeholder="Rechercher..."/>
                            <CommandEmpty>Aucun résultat.</CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                <CommandItem
                                    v-for="(item, index) in filteredProperty"
                                    :key="index"
                                    :value="item"
                                    @select="(ev) => {
                                      if (typeof ev.detail.value === 'string') {
                                        field.typeName = ev.detail.value
                                      }
                                      field.open = false
                                    }"
                                >
                                  {{ item }}
                                  <Check
                                      :class="{
                                        'ml-auto h-4 w-4': true,
                                        'opacity-100': field.typeName === item,
                                        'opacity-0': field.typeName !== item
                                      }"
                                  />

                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Trash2 class="text-red-500 w-12 h-12 cursor-pointer" @click="removeFieldAssociation(index)"/>
                  </div>
                </TransitionGroup>
              </ScrollArea>


            </div>
            -->
          </div>

          <!-- Advanced actions: CIF for ternary edges -->
          <div v-if="isTernaryEdgeSelected" class="mt-4 pt-4 border-t border-gray-100 w-full">
            <Button
              variant="ghost"
              size="sm"
              class="px-0 h-auto text-xs text-gray-400 hover:text-gray-600 hover:bg-transparent mb-2 gap-1.5"
              @click="showAdvancedEdge = !showAdvancedEdge"
            >
              <ChevronRight
                :class="['w-3 h-3 transition-transform duration-200', showAdvancedEdge ? 'rotate-90' : '']"
              />
              Actions avancées
            </Button>
            <Transition name="add-field">
              <div v-if="showAdvancedEdge" class="flex flex-col gap-2">
                <div class="items-top flex gap-x-2 px-2 py-2 rounded border border-dashed border-gray-200">
                  <Checkbox id="field-cif" v-model:checked="edgeCIF"/>
                  <div class="grid gap-1.5 leading-none">
                    <label
                        for="field-cif"
                        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Contrainte d'Intégrité Fonctionnelle (CIF)
                    </label>
                    <p class="text-xs text-gray-400">
                      Indique une dépendance fonctionnelle dans cette relation ternaire
                    </p>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

        </div>

      </div>
    </div>

  </Transition>


</template>

<script setup lang="ts">
import {computed, nextTick, ref, watch, onBeforeUnmount as onBeforeUnmountHook} from "vue";
import {storeToRefs} from "pinia";
import {useMCDStore} from "~/stores/mcd-store.js";
import {useUndoRedoStore} from "~/stores/undo-redo-store.js";
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from '@/components/ui/command';
import {
  Check,
  ChevronsUpDown,
  ChevronRight,
  CirclePlus,
  Trash2,
  MoveRight,
  KeyRound,
  CircleAlert,
  GripVertical,
  X
} from 'lucide-vue-next';
import NullableIcon from '@/components/icon/nullable-icon';
import draggable from 'vuedraggable';
import {v4 as uuidv4} from 'uuid';

const preventBodyScroll = () => {
  document.body.style.overflow = 'hidden';
}

const restoreBodyScroll = () => {
  document.body.style.overflow = '';
}

// Ensure body scroll is restored even if component is unmounted
onBeforeUnmountHook(() => {
  restoreBodyScroll();
});
const scrollAreaRef = ref(null);
const nodeNameInputRef = ref(null);
const edgeNameInputRef = ref(null);

const route = useRoute();
const mcdStore = useMCDStore();
const undoRedoStore = useUndoRedoStore();
const {isSubMenuVisible, nodeIdSelected, edgeIdSelected, isSaving, isNewlyCreated} = storeToRefs(mcdStore);
const {removeEdge, removeNode, addTernaryRelation, getLoopbackEdges, getTernaryRelations, LOOPBACK_SIDES} = mcdStore

const startTernaryMode = () => {
  mcdStore.isTernaryMode = true
  mcdStore.ternarySelectedNodes = []
  isSubMenuVisible.value = false
}

const showAdvanced = ref(false)
const showAdvancedEdge = ref(false)

const loopbackCount = computed(() => {
  if (!nodeIdSelected.value) return 0;
  return getLoopbackEdges(nodeIdSelected.value).length;
});

const ternaryCount = computed(() => {
  if (!nodeIdSelected.value) return 0;
  return getTernaryRelations(nodeIdSelected.value);
});

const canAddLoopback = computed(() => loopbackCount.value < LOOPBACK_SIDES.length);

const createLoopbackEdge = async () => {
  if (!nodeIdSelected.value || !canAddLoopback.value) return
  await mcdStore.addLoopbackEdge(route.params.idModel, nodeIdSelected.value)
}

// CIF (Contrainte d'Intégrité Fonctionnelle) for ternary edges
const isTernaryEdgeSelected = computed(() => {
  if (!edgeIdSelected.value) return false;
  const edge = mcdStore.flowMCD?.findEdge(edgeIdSelected.value);
  if (!edge) return false;
  const sourceNode = mcdStore.flowMCD?.findNode(edge.source);
  const targetNode = mcdStore.flowMCD?.findNode(edge.target);
  return sourceNode?.type === 'ternaryEntity' || targetNode?.type === 'ternaryEntity';
});

const edgeCIF = computed({
  get() {
    return edgeData?.value?.data?.isCIF ?? false;
  },
  set(value) {
    if (edgeData?.value?.data) {
      edgeData.value.data.isCIF = value;
    }
  },
});

const nodeData = ref(null);
const edgeData = ref(null);

// Auto-focus the name input - handles both fresh open and already-open drawer
const _pendingFocusRef = ref(null)

const focusInput = (inputRef) => {
  const el = inputRef.value?.$el ?? inputRef.value
  el?.focus({ preventScroll: true })
}

const onDrawerEntered = () => {
  if (_pendingFocusRef.value) {
    focusInput(_pendingFocusRef.value)
    _pendingFocusRef.value = null
  }
}

watch(
  () => [nodeIdSelected.value, edgeIdSelected.value],
  async ([newNodeId, newEdgeId], old) => {
    // Only auto-focus when a brand-new node/edge was just created
    if (!isNewlyCreated.value) return
    isNewlyCreated.value = false

    const [oldNodeId, oldEdgeId] = old ?? [null, null]
    let targetRef = null
    if (newNodeId !== null && newNodeId !== oldNodeId) {
      targetRef = nodeNameInputRef
    } else if (newEdgeId !== null && newEdgeId !== oldEdgeId) {
      targetRef = edgeNameInputRef
    }
    if (!targetRef) return

    if (isSubMenuVisible.value) {
      // Drawer already open - input is in DOM, just wait for reactivity update
      await nextTick()
      focusInput(targetRef)
    } else {
      // Drawer about to open - defer until transition ends
      _pendingFocusRef.value = targetRef
    }
  }
)

// Snapshot of node/edge data at selection time — used as inverse for undo.
// Only captured on selection change or after explicit save, NOT on every
// VueFlow state change (which would overwrite the snapshot after undo/redo).
let _snapshotNodeData = null
let _snapshotEdgeData = null

// Keep nodeData/edgeData refs in sync with VueFlow state (needed for UI bindings).
// Watch nodes/edges arrays so refs stay fresh after setNodes (e.g. after undo).
watch(
  () => [
    nodeIdSelected.value,
    edgeIdSelected.value,
    mcdStore?.flowMCD?.getNodes?.value,
    mcdStore?.flowMCD?.getEdges?.value,
  ],
  () => {
    nodeData.value = mcdStore?.flowMCD?.findNode(nodeIdSelected.value) ?? null;
    edgeData.value = mcdStore?.flowMCD?.findEdge(edgeIdSelected.value) ?? null;
  },
  { immediate: true }
);

// Capture snapshots ONLY when the selected node/edge changes (not on every state update).
// This prevents undo/redo from overwriting the inverse data.
watch(
  () => [nodeIdSelected.value, edgeIdSelected.value],
  () => {
    nodeData.value = mcdStore?.flowMCD?.findNode(nodeIdSelected.value) ?? null;
    edgeData.value = mcdStore?.flowMCD?.findEdge(edgeIdSelected.value) ?? null;
    _snapshotNodeData = nodeData.value?.data ? JSON.parse(JSON.stringify(nodeData.value.data)) : null
    _snapshotEdgeData = edgeData.value?.data ? JSON.parse(JSON.stringify(edgeData.value.data)) : null
    showAdvanced.value = false;
    showAdvancedEdge.value = false;
  },
  { immediate: true }
);


const updateNode = async () => {
  isSaving.value = true;
  await mcdStore.updateNode(route.params.idModel, nodeData.value.id, _snapshotNodeData)
  // Update snapshot to current state after save (for subsequent edits)
  _snapshotNodeData = nodeData.value?.data ? JSON.parse(JSON.stringify(nodeData.value.data)) : null
  isSaving.value = false;
};

const updateEdge = async () => {
  isSaving.value = true;
  await mcdStore.updateEdge(route.params.idModel, edgeIdSelected.value, _snapshotEdgeData)
  // Update snapshot to current state after save
  _snapshotEdgeData = edgeData.value?.data ? JSON.parse(JSON.stringify(edgeData.value.data)) : null
  isSaving.value = false;
};

// --- Auto-save with debounce ---
const AUTO_SAVE_DELAY = 800
let _autoSaveNodeTimer = null
let _autoSaveEdgeTimer = null

function cancelNodeTimer() {
  if (_autoSaveNodeTimer) { clearTimeout(_autoSaveNodeTimer); _autoSaveNodeTimer = null }
}
function cancelEdgeTimer() {
  if (_autoSaveEdgeTimer) { clearTimeout(_autoSaveEdgeTimer); _autoSaveEdgeTimer = null }
}

// Check if data actually differs from snapshot before saving
function hasNodeChanges() {
  if (!nodeData.value?.data || !nodeIdSelected.value) return false
  return JSON.stringify(nodeData.value.data) !== JSON.stringify(_snapshotNodeData)
}
function hasEdgeChanges() {
  if (!edgeData.value?.data || !edgeIdSelected.value) return false
  return JSON.stringify(edgeData.value.data) !== JSON.stringify(_snapshotEdgeData)
}

function scheduleAutoSaveNode() {
  cancelNodeTimer()
  _autoSaveNodeTimer = setTimeout(() => {
    _autoSaveNodeTimer = null
    if (undoRedoStore.isUndoRedoing) return
    if (hasNodeChanges()) updateNode()
  }, AUTO_SAVE_DELAY)
}

function scheduleAutoSaveEdge() {
  cancelEdgeTimer()
  _autoSaveEdgeTimer = setTimeout(() => {
    _autoSaveEdgeTimer = null
    if (undoRedoStore.isUndoRedoing) return
    if (hasEdgeChanges()) updateEdge()
  }, AUTO_SAVE_DELAY)
}

// Save immediately (used for structural changes that must be undoable right away)
function saveNodeNow() {
  cancelNodeTimer()
  if (hasNodeChanges()) updateNode()
}
function saveEdgeNow() {
  cancelEdgeTimer()
  if (hasEdgeChanges()) updateEdge()
}

// Deep watcher on node data — handle undo/redo by refreshing snapshot
watch(
  () => nodeData.value?.data,
  () => {
    if (!nodeData.value?.data || !nodeIdSelected.value) return
    if (undoRedoStore.isUndoRedoing) {
      // Undo/redo just changed data — cancel pending auto-save and refresh snapshot
      cancelNodeTimer()
      _snapshotNodeData = JSON.parse(JSON.stringify(nodeData.value.data))
      return
    }
    if (!hasNodeChanges()) return
    scheduleAutoSaveNode()
  },
  { deep: true }
)

// Deep watcher on edge data — handle undo/redo by refreshing snapshot
watch(
  () => edgeData.value?.data,
  () => {
    if (!edgeData.value?.data || !edgeIdSelected.value) return
    if (undoRedoStore.isUndoRedoing) {
      cancelEdgeTimer()
      _snapshotEdgeData = JSON.parse(JSON.stringify(edgeData.value.data))
      return
    }
    if (!hasEdgeChanges()) return
    scheduleAutoSaveEdge()
  },
  { deep: true }
)

// Flush pending auto-save on close or unmount (only if there are actual changes)
watch(isSubMenuVisible, (visible) => {
  if (!visible) {
    cancelNodeTimer()
    cancelEdgeTimer()
    if (hasNodeChanges()) updateNode()
    if (hasEdgeChanges()) updateEdge()
  }
})

onBeforeUnmountHook(() => {
  cancelNodeTimer()
  cancelEdgeTimer()
})

const removeEdgeById = async () => {
  await removeEdge(route.params.idModel, edgeIdSelected.value)
}

const removeNodeById = async () => {
  await removeNode(route.params.idModel, nodeIdSelected.value)
}


const addFieldAssociation = () => {
  // Flush pending changes before structural mutation
  saveEdgeNow()
  mcdStore.flowMCD.updateEdgeData(edgeIdSelected.value, (edge) => {
    edge.data.properties.push({
      id: uuidv4(),
      propertyName: "",
      typeName: "Propriété",
      open: false,
      isPrimaryKey: false,
      autoIncrement: false,
      isForeignKey: false,
      isNullable: false,
    });
  });
  // Save immediately so undo can revert this field addition
  saveEdgeNow()
};

const addField = () => {
  // Flush pending changes before structural mutation
  saveNodeNow()
  mcdStore.flowMCD.updateNodeData(nodeData.value.id, (node) => {
    node.data.properties.push({
      id: uuidv4(),
      propertyName: "",
      typeName: "Propriété",
      open: false,
      isPrimaryKey: false,
      autoIncrement: false,
      isForeignKey: false,
      isNullable: false,
    });
  });
  // Save immediately so undo can revert this field addition
  saveNodeNow()
};

const removeField = (id) => {
  // Flush pending changes before structural mutation
  saveNodeNow()
  mcdStore.flowMCD.updateNodeData(nodeData.value.id, (node) => {
    node.data.properties = node.data.properties.filter(property => property.id !== id);
  });
  // Save immediately so undo can revert this field removal
  saveNodeNow()
};

const removeFieldAssociation = (id) => {
  // Flush pending changes before structural mutation
  saveEdgeNow()
  mcdStore.flowMCD.updateEdgeData(edgeIdSelected.value, (edge) => {
    edge.data.properties = edge.data.properties.filter(property => property.id !== id);
  });
  // Save immediately so undo can revert this field removal
  saveEdgeNow()
};

const nodeName = computed({
  get() {
    return nodeData?.value?.data?.name ?? "";
  },
  set(value) {
    if (nodeData && nodeData.value.data) {
      nodeData.value.data.name = value;
    }
  },
});

const nodeTimestamps = computed({
  get() {
    return nodeData?.value?.data?.hasTimestamps;
  },
  set(value) {
    if (nodeData && nodeData.value.data) {
      nodeData.value.data.hasTimestamps = value;
    }
  },
});

const nodeSoftDeletes = computed({
  get() {
    return nodeData?.value?.data?.usesSoftDeletes;
  },
  set(value) {
    if (nodeData && nodeData.value.data) {
      nodeData.value.data.usesSoftDeletes = value;
    }
  },
});

const edgeName = computed({
  get() {
    return edgeData?.value?.data?.name ?? "";
  },
  set(value) {
    if (edgeData && edgeData.value.data) {
      edgeData.value.data.name = value;
    }
  },
});

const edgeTimestamps = computed({
  get() {
    return edgeData?.value?.data?.hasTimestamps;
  },
  set(value) {
    if (edgeData && edgeData.value.data) {
      edgeData.value.data.hasTimestamps = value;
    }
  },
});

const edgeSoftDeletes = computed({
  get() {
    return edgeData?.value?.data?.usesSoftDeletes;
  },
  set(value) {
    if (edgeData && edgeData.value.data) {
      edgeData.value.data.usesSoftDeletes = value;
    }
  },
});


const sourceCardinality = computed({
  get() {
    return mcdStore.flowMCD?.findEdge(edgeIdSelected.value)?.data?.sourceCardinality ?? "";
  },
  set(value) {
    const edge = mcdStore.flowMCD?.findEdge(edgeIdSelected.value);
    if (edge?.data) edge.data.sourceCardinality = value;
  },
});

const targetCardinality = computed({
  get() {
    return mcdStore.flowMCD?.findEdge(edgeIdSelected.value)?.data?.targetCardinality ?? "";
  },
  set(value) {
    const edge = mcdStore.flowMCD?.findEdge(edgeIdSelected.value);
    if (edge?.data) edge.data.targetCardinality = value;
  },
});

const checkIfTwoNRelation = computed(() => {
  const src = sourceCardinality.value?.split(',')[1] ?? '';
  const tgt = targetCardinality.value?.split(',')[1] ?? '';
  return src === 'N' && tgt === 'N';
});

// Sync hasNodeAssociation flag when cardinality changes to/from N:N
watch(checkIfTwoNRelation, (isNN) => {
  if (!edgeIdSelected.value) return;
  const edge = mcdStore.flowMCD?.findEdge(edgeIdSelected.value);
  if (edge?.data && edge.data.hasNodeAssociation !== isNN) {
    edge.data.hasNodeAssociation = isNN;
  }
});

const type = [
  "String",
  "Integer",
  "Big Integer",
  "Boolean",
  "Date",
  "Time",
  "DateTime",
  "Decimal",
  "Double",
  "Float",
  "Long",
  "Text",
  "Timestamp",
  "UUID",
  "Binary",
  "Image",
  "File",
  "Json",
];

const filteredProperty = computed(() => type);


</script>

<style scoped>
.drawer-enter-active, .drawer-leave-active {
  transition: transform 0.4s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);

}

.drawer-leave-from {
  transform: translateX(0%);
}

.add-field-enter-active,
.add-field-leave-active {
  transition: opacity 0.5s ease;
}

.add-field-enter-from,
.add-field-leave-to {
  opacity: 0;
}

/* 1. declare transition */
.fade-move,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s cubic-bezier(0.55, 0, 0.1, 1);
}

/* 2. declare enter from and leave to state */
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>

