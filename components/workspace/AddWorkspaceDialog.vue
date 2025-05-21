<template>
  <div>
    <div>
      <Button 
        @click="isCreateWorkspaceDialogOpen = true"
        :variant="isOnlyIcon ? 'outline' : 'default'"
        :size="isOnlyIcon ? 'icon' : 'default'"
        :class="isOnlyIcon ? 'h-8 w-8' : ''"
      >
        <Plus :size="17" />
        {{ isOnlyIcon ? '' : 'Ajouter un espace de travail'}}
      </Button>
    </div>

    <!-- Add Workspace Dialog -->
    <Dialog v-model:open="isCreateWorkspaceDialogOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un espace de travail</DialogTitle>
          <DialogDescription>Créez un nouvel espace de travail pour votre équipe.</DialogDescription>
        </DialogHeader>
        <form @submit.prevent="onSubmit">
          <div class="grid gap-4 py-4">
            <FormField v-slot="{ componentField }" name="name">
              <FormItem>
                <FormLabel for="name">Nom de l'espace de travail</FormLabel>
                <FormControl>
                  <Input 
                    v-bind="componentField" 
                    id="name" 
                    placeholder="Mon espace de travail" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="description">
              <FormItem>
                <FormLabel for="description">Description (optionnel)</FormLabel>
                <FormControl>
                  <Textarea 
                    v-bind="componentField" 
                    id="description" 
                    placeholder="Description de l'espace de travail"
                    rows="3"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <div v-if="message.type !== ''">
              <div v-if="message.type === 'error'" class="w-full">
                <div class="flex justify-start p-4 gap-x-2 rounded-md bg-red-50 border border-red-300">
                  <AlertCircle class="h-6 w-6 text-red-500" />
                  <p class="text-red-600">{{ message.text }}</p>
                </div>
              </div>

              <div v-if="message.type === 'success'" class="w-full">
                <div class="flex justify-start p-4 gap-x-2 rounded-md bg-green-50 border border-green-300">
                  <CheckCircle class="h-6 w-6 text-green-500" />
                  <p class="text-green-600">{{ message.text }}</p>
                </div>
              </div>
            </div>

            <FormField name="button-submit">
              <FormControl>
                <div class="flex justify-end gap-2">
                  <Button type="submit" :disabled="isFormLoading">
                    <Loader2 v-if="isFormLoading" class="w-4 h-4 mr-2 animate-spin"/>
                    {{ isFormLoading ? "Chargement..." : "Ajouter" }}
                  </Button>
                  <Button variant="outline" @click="isCreateWorkspaceDialogOpen = false">Annuler</Button>
                </div>
              </FormControl>
            </FormField>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, CheckCircle, Plus } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { useWorkspace } from '@/composables/api/useWorkspace'

// Props
const props = defineProps({
  isOnlyIcon: {
    type: Boolean,
    default: false
  }
})

const { addWorkspace } = useWorkspace()
const isCreateWorkspaceDialogOpen = ref(false)
const isFormLoading = ref(false)
const message = reactive({
  type: '',
  text: ''
})

// Définition du schéma de validation avec Zod
const formSchema = toTypedSchema(z.object({
  name: z.string({
    error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : ""
  }).min(2, 'Le nom doit être supérieur à 2 caractères.').max(50, 'Le nom ne doit pas dépasser 50 caractères.'),
  description: z.string().optional(),
}))

// Utilisation du hook useForm avec le schéma de validation
const { handleSubmit, resetForm } = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: '',
    description: '',
  }
})

const { data } = useAuth()

// Fonction de soumission du formulaire
const onSubmit = handleSubmit(async (values) => {
  try {
    
    message.type = ''
    message.text = ''
    isFormLoading.value = true

    console.log('Valeurs du formulaire:', {...values, userId: data.value.user.id ?? null});

    const res = await addWorkspace({...values, userId: data.value.user.id ?? null, userEmail: data.value.user.email ?? null})
    
    // Ici, vous feriez normalement un appel API pour créer l'espace de travail
    console.log('Création de l\'espace de travail:', values)
    
    if (res.status === 200) {
     
      // Affichage d'une notification de succès
      message.type = 'success'
      message.text = 'Espace de travail créé avec succès !'
      
      // Réinitialisation du formulaire après un court délai
      setTimeout(() => {
        resetForm()
        isCreateWorkspaceDialogOpen.value = false
        message.type = ''
        message.text = ''
      }, 2000)
  }
    
  } catch (error) {
    console.error('Erreur lors de la création de l\'espace de travail:', error)
    message.type = 'error'
    message.text = 'Une erreur est survenue lors de la création de l\'espace de travail.'
  } finally {
    isFormLoading.value = false
  }
})
</script>