<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="outline" class=" border-none rounded-sm">
        <GalleryHorizontalEnd :size="18"/>
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[380px]">
      <DialogHeader>
        <DialogTitle>Créer un modèle de galerie</DialogTitle>
        <DialogDescription>
          Une fois crée modèle sera disponible dans la galerie.
        </DialogDescription>
      </DialogHeader>

      <form id="dialogForm" @submit="onSubmit">
        <FormField name="category">
          <FormItem class="flex flex-col">
            <FormLabel>Catégorie</FormLabel>
            <Popover>
              <PopoverTrigger as-child>
                <FormControl>
                  <Button
                      variant="outline"
                      role="combobox"
                      class="w-full justify-between"
                      :class="!values.category && 'text-muted-foreground'"
                  >
                    {{
                      values.category ? categories.find(
                          (category) => category.value === values.category,
                      )?.label : 'Séléctionner ou créer une catégorie...'
                    }}
                    <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent align="start" class="p-0">
                <Command>
                  <CommandInput placeholder="Rechercher..."/>
                  <CommandEmpty>Aucun résultat.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      <CommandItem
                          v-for="category in categories"
                          :key="category.value"
                          :value="category.label"
                          @select="() => {
                          setFieldValue('category', category.value)
                        }"
                      >
                        <Check
                            class="mr-2 h-4 w-4"
                            :class="category.value === values.category ? 'opacity-100' : 'opacity-0'"
                        />
                        {{ category.label }}
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                  <div class="p-2 border-t">
                    <Input
                        v-model="newCategory"
                        type="text"
                        placeholder="Ajouter une catégorie"
                        class="w-full border rounded-md p-2 mb-2"
                    />
                    <div v-if="categoryAlreadyExistsMessage !== ''" class="text-red-500 text-sm py-2">
                      {{ categoryAlreadyExistsMessage }}
                    </div>
                    <Button @click.prevent="addCategory" class="w-full">
                      Ajouter
                    </Button>
                  </div>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage/>
          </FormItem>
        </FormField>
      </form>

      <DialogFooter>
        <Button type="submit" form="dialogForm" :disabled="isCreatingGaleryModel">
          <Loader2 v-if="isCreatingGaleryModel" class="w-4 h-4 mr-2 animate-spin"/>
          {{ isCreatingGaleryModel ? 'Création...' : 'Créer' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import {ref} from 'vue'
import {Button} from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {useToast} from '@/components/ui/toast/use-toast'
import {Toaster} from '@/components/ui/toast'
import {toTypedSchema} from '@vee-validate/zod'
import {Check, ChevronsUpDown, GalleryHorizontalEnd, Loader2} from 'lucide-vue-next'
import {useForm} from 'vee-validate'
import * as z from 'zod'

const categories = ref([])

const formSchema = toTypedSchema(z.object({
  category: z.string({
    error: (issue) => issue.input === undefined 
    ? "Vous devez créer ou séléctionner une catégorie." 
    : "Ceci n'est pas une catégorie valide.", 
  }),
}))

const {handleSubmit, setFieldValue, values} = useForm({
  validationSchema: formSchema,
  initialValues: {
    category: ''
  },
})

const isCreatingGaleryModel = ref(false)
const categoryAlreadyExistsMessage = ref('')
const newCategory = ref('')
const {toast} = useToast()
const isOpen = ref(false)

const addCategory = async () => {
  if (newCategory.value.trim() && !categories.value.find(cat => cat.value.toLowerCase() === newCategory.value.trim().toLowerCase())) {

    const res = await $fetch("/api/categories/create", {
      method: "POST",
      body: {name: newCategory.value.trim()},
    });
    if (res) {
      const value = newCategory.value.trim()
      categories.value.push({label: value, value: value.toLowerCase(), id: res.id})
      setFieldValue('category', value)
      newCategory.value = ''
    } else {
      categoryAlreadyExistsMessage.value = 'Impossible d\'ajouter une catégorie.'
    }
  } else {
    categoryAlreadyExistsMessage.value = 'Cette catégorie existe déjà.'
  }
}

watch(() => isOpen.value, () => {
  if (isOpen.value === false) {
    newCategory.value = ''
    categoryAlreadyExistsMessage.value = ''
  }
})

const route = useRoute()

const onSubmit = handleSubmit(async (values) => {
  isCreatingGaleryModel.value = true

  const res = await $fetch("/api/galeries/create", {
    method: "POST",
    body: {
      idModel: route.params.idModel,
      idCategory: categories.value.find(cat => cat.value === values.category).id,
    },
  });
  if (res) {

  }

  isOpen.value = false
  newCategory.value = ''
  categoryAlreadyExistsMessage.value = ''
  isCreatingGaleryModel.value = false
})

onMounted(async () => {
  const res = await $fetch("/api/categories/list")
  if (res) {
    categories.value = res.map(cat => ({label: cat.name, value: cat.name.toLowerCase(), id: cat.id}))
  }
})

onUnmounted(() => {
  isOpen.value = false
  newCategory.value = ''
  categoryAlreadyExistsMessage.value = ''
  isCreatingGaleryModel.value = false
})
</script>
