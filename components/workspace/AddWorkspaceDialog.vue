<template>
  <div>
    <Dialog v-model:open="isCreateWorkspaceDialogOpen">
      <DialogTrigger as-child>
         <Button 
            @click="isCreateWorkspaceDialogOpen = true"
            :variant="isOnlyIcon ? 'outline' : 'default'"
            :size="isOnlyIcon ? 'icon' : 'default'"
            :class="isOnlyIcon ? 'h-8 w-8' : ''"
          >
            <Plus :size="17" />
            {{ isOnlyIcon ? '' : 'Ajouter un espace de travail'}}
          </Button>
      </DialogTrigger>

      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un espace de travail</DialogTitle>
          <DialogDescription>
            Créez un nouvel espace de travail pour votre équipe.
          </DialogDescription>
        </DialogHeader>

        <!-- ← On garde as="" pour Form, pas de wrapper -->
        <Form
          v-slot="{ handleSubmit }"
          as=""
          :validation-schema="formSchema"
        >
          <!-- Le vrai <form> natif -->
          <form
            id="dialogForm"
            class="grid gap-4 py-4"
            @submit="handleSubmit($event, onSubmit)"
          >
            <FormField name="name" v-slot="{ componentField }">
              <FormItem>
                <FormLabel for="name">Nom de l'espace</FormLabel>
                <FormControl>
                  <Input v-bind="componentField" id="name" placeholder="Mon espace de travail" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField name="description" v-slot="{ componentField }">
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

            <!-- Vos messages d’erreur / succès… -->
          </form>

          <DialogFooter class="flex justify-end gap-2">
            <Button
              type="submit"
              form="dialogForm"
              :disabled="isFormLoading"
            >
              <Loader2 v-if="isFormLoading" class="w-4 h-4 mr-2 animate-spin" />
              {{ isFormLoading ? 'Chargement…' : 'Ajouter' }}
            </Button>
            <Button variant="outline" @click="isCreateWorkspaceDialogOpen = false">
              Annuler
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { useWorkspace } from '@/composables/api/useWorkspace'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, AlertCircle, CheckCircle } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'

defineProps({ isOnlyIcon: Boolean })
const { addWorkspace } = useWorkspace()
const isCreateWorkspaceDialogOpen = ref(false)
const isFormLoading = ref(false)
const { data } = useAuth()

const { toast } = useToast()

// const message = ref({ type: '', text: '' })
// const setMessage = (type: string, text: string) => {
//   message.value.type = type
//   message.value.text = text
// }

const formSchema = toTypedSchema(z.object({
  name: z.string({ message: 'Champs requis' }).min(2, 'Le nom doit contenir au moins 2 caractères').max(50),
  description: z.string().optional(),
}))

const { resetForm } = useForm({
  validationSchema: formSchema,
  initialValues: { name: '', description: '' },
})



const onSubmit = async (values) => {
  isFormLoading.value = true
  const res = await addWorkspace({...values, userId: data.value.user.id ?? null, userEmail: data.value.user.email ?? null})
  
  
  resetForm()
  isCreateWorkspaceDialogOpen.value = false
  isFormLoading.value = false

  console.log('Response from addWorkspace:', res)

  if (res.status === 200) {
    toast({
        title: 'Succès',
        message: res.body.message,
        variant: 'default',
    });
  } else {
    toast({
        title: 'Erreur',
        message: res.body.message,
        variant: 'destructive',
    });
  }
}
</script>