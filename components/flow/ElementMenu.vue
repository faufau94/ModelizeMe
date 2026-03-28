<template>
  <Transition
      name="drawer"
      @before-enter="preventBodyScroll"
      @after-enter="onDrawerEntered"
      @after-leave="restoreBodyScroll"
  >

    <div v-if="isSubMenuVisible"
         key="submenu"

         class="absolute overflow-hidden z-40 md:w-[570px] px-4 shadow-lg top-0 right-0 h-screen flex flex-col justify-between border-e bg-white"

    >

      <div v-if="nodeIdSelected !== null" class="px-5 py-10 flex flex-col justify-between items-center h-full">
        <div class="w-full">
          <p class="font-bold text-xl">Entité</p>
          <div class="max-w-sm mt-6">
            <label for="input-label" class="block text-sm font-medium mb-2 dark:text-white">Nom de l'entité</label>
            <Input ref="nodeNameInputRef" v-model="nodeName" type="text"/>
          </div>

          <div class="w-full flex items-center justify-start gap-x-8">
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
            <ScrollArea ref="scrollAreaRef" class="h-[400px] pr-4 ">

              <draggable
                  v-if="nodeData && nodeData.data?.properties"
                  v-model="nodeData.data.properties"
                  item-key="id"
                  animation="200"
              >
                <template #item="{element}">

                  <div class="flex flex-col md:flex-row sm:items-center  sm:space-y-0 sm:space-x-3 w-full">

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
        </div>

        <div class="flex flex-col w-full md:flex-row justify-between items-center gap-4">
          <div>
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button variant="destructive" class="border-none rounded-sm">
                  Supprimer
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
                  <Button @click="removeNodeById" variant="destructive"
                          class="border-none rounded-sm">
                    Supprimer
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        <div class="flex flex-col  w-full md:flex-row justify-end gap-4 self-end">
          <Button @click="isSubMenuVisible = false" variant="outline">
            Fermer
          </Button>
          <Button @click="updateNode" :disabled="isSaving">
            <Loader2 v-if="isSaving" class="w-4 h-4 mr-2 animate-spin"/>
            {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}
          </Button>
        </div>
        </div>


      </div>

      <div v-else-if="edgeIdSelected !== null" class="px-5 py-10 flex flex-col justify-between items-center h-full">

        <div class="w-full">
          <p class="font-bold text-xl">Cardinalité</p>
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
              <ScrollArea ref="scrollAreaRef" class="h-[250px] pr-4 ">

                <draggable
                    v-if="edgeData && edgeData.data?.properties"
                    v-model="edgeData.data.properties"
                    item-key="id"
                    animation="200"
                >
                  <template #item="{element}">

                    <div class="flex flex-col md:flex-row sm:items-center  sm:space-y-0 sm:space-x-3 w-full">

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

        </div>

        <div class="flex flex-col w-full md:flex-row justify-between items-center gap-4">
          <div>
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button variant="destructive" class="border-none rounded-sm">
                  Supprimer
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
                  <Button @click="removeEdgeById" variant="destructive"
                          class="border-none rounded-sm">
                    Supprimer
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div class="space-x-4">
            <Button @click="isSubMenuVisible = false" variant="outline">
              Fermer
            </Button>
            <Button @click="updateEdge" :disabled="isSaving">
              <Loader2 v-if="isSaving" class="w-4 h-4 mr-2 animate-spin"/>
              {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}
            </Button>
          </div>
        </div>

      </div>
    </div>

  </Transition>

</template>

<script setup lang="ts">
import {computed, nextTick, ref, watch} from "vue";
import {storeToRefs} from "pinia";
import {useMCDStore} from "~/stores/mcd-store.js";
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
  CirclePlus,
  Loader2,
  Trash2,
  MoveRight,
  KeyRound,
  CircleAlert,
  GripVertical
} from 'lucide-vue-next';
import NullableIcon from '@/components/icon/nullable-icon';
import {onBeforeUnmount} from 'vue';
import draggable from 'vuedraggable';
import {v4 as uuidv4} from 'uuid';

const preventBodyScroll = () => {
  document.body.style.overflow = 'hidden';
}

const restoreBodyScroll = () => {
  document.body.style.overflow = '';
}

// Assurez-vous de restaurer le scroll même si le composant est démonté
onBeforeUnmount(() => {
  restoreBodyScroll();
});
const scrollAreaRef = ref(null);
const nodeNameInputRef = ref(null);
const edgeNameInputRef = ref(null);

const route = useRoute();
const mcdStore = useMCDStore();
const {isSubMenuVisible, nodeIdSelected, edgeIdSelected, isSaving, isNewlyCreated} = storeToRefs(mcdStore);
const {removeEdge, removeNode} = mcdStore

const nodeData = ref(null);
const edgeData = ref(null);

// Auto-focus the name input — handles both fresh open and already-open drawer
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
      // Drawer already open — input is in DOM, just wait for reactivity update
      await nextTick()
      focusInput(targetRef)
    } else {
      // Drawer about to open — defer until transition ends
      _pendingFocusRef.value = targetRef
    }
  }
)

// Re-read node/edge from VueFlow when selection changes OR after undo/redo.
// Watch the VueFlow nodes/edges arrays directly so refs stay fresh after setNodes.
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


const updateNode = async () => {
  isSaving.value = true;
  await mcdStore.updateNode(route.params.idModel, nodeData.value.id)

  mcdStore?.flowMCD.updateNodeData(nodeData.value.id, (node) => {
    node.data = nodeData.value.data;
  });
  isSaving.value = false;
};

const updateEdge = async () => {
  isSaving.value = true;
  await mcdStore.updateEdge(route.params.idModel, edgeIdSelected.value)
  isSaving.value = false;
};

const removeEdgeById = async () => {
  await removeEdge(route.params.idModel, edgeIdSelected.value)
}

const removeNodeById = async () => {
  await removeNode(route.params.idModel, nodeIdSelected.value)
}


const addFieldAssociation = () => {
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
};

const addField = () => {
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
  //scrollAreaRef.value.scrollTop = scrollAreaRef.value.scrollHeight;
};

const removeField = (id) => {
  mcdStore.flowMCD.updateNodeData(nodeData.value.id, (node) => {
    node.data.properties = node.data.properties.filter(property => property.id !== id);
  });
};

const removeFieldAssociation = (id) => {
  mcdStore.flowMCD.updateEdgeData(edgeIdSelected.value, (edge) => {
    edge.data.properties = edge.data.properties.filter(property => property.id !== id);
  });
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

