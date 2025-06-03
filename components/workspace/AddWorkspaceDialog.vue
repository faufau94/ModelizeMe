<template>
  <div>
    <!-- Workspace Creation Dialog -->
    <Dialog v-model:open="isDialogOpen">
      <DialogTrigger as-child>
        <Button 
          @click="isDialogOpen = true"
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
          <DialogTitle>
            {{ stepIndex === 1 ? "Ajouter un espace de travail" : "Inviter des membres" }}
          </DialogTitle>
          <DialogDescription>
            {{ stepIndex === 1 ? "Créez un nouvel espace de travail pour votre équipe." : "Invitez des membres à rejoindre votre espace de travail." }}
          </DialogDescription>
        </DialogHeader>
        <Form
          ref="formRef"
          v-slot="{ meta, values, validate }"
          as=""
          keep-values
          :validation-schema="formSchema"
        >
          <form
            @submit="async (e) => {
              e.preventDefault()
              await validate()
              if (meta.valid) {
                await handleSubmit(values)
              }
            }"
          >
            <div class="flex flex-col gap-4 mt-4">
              <template v-if="stepIndex === 1">
                <FormField name="name" v-slot="{ componentField }">
                  <FormItem>
                    <FormLabel>Nom de l'espace</FormLabel>
                    <FormControl>
                      <Input v-bind="componentField" placeholder="Mon espace de travail" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField name="description" v-slot="{ componentField }">
                  <FormItem>
                    <FormLabel>Description (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea v-bind="componentField" placeholder="Description de l'espace de travail" rows="3" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </template>
              <template v-if="stepIndex === 2">
                <FormField name="emails" v-slot="{ componentField }">
                  <FormItem>
                    <FormLabel>Adresses email (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        v-bind="componentField"
                        placeholder="Entrez ou collez une ou plusieurs adresses email, séparées par des espaces ou des virgules"
                        rows="3"
                      />
                    </FormControl>
                    <FormDescription>
                      Vous pourrez toujours inviter des membres plus tard.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </template>
            </div>
            <div class="flex items-center justify-between mt-4">
              <Button v-if="stepIndex === 2" variant="outline" size="sm" @click.prevent="stepIndex = 1">
                Retour
              </Button>
              <div class="flex items-center gap-3 ml-auto">
                <Button v-if="stepIndex === 1" type="button" :disabled="!meta.valid" size="sm" @click="meta.valid && (stepIndex = 2)">
                  Suivant
                </Button>
                <Button v-if="stepIndex === 2" size="sm" type="submit" :disabled="isLoading">
                  <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                  {{ isLoading ? 'Création...' : 'Créer l\'espace de travail' }}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useSession, authClient } from '~/lib/auth-client'

defineProps({ isOnlyIcon: Boolean })
const { addWorkspace, switchWorkspace } = useWorkspace()
const isDialogOpen = ref(false)
const isLoading = ref(false)
const stepIndex = ref(1)
const { data } = await useSession(useFetch)
const formRef = ref<any>(null)

const formSchema = toTypedSchema(z.object({
  name: z.string({ message: 'Champs requis' })
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50),
  description: z.string().optional(),
  emails: z.string()
    .optional()
    .transform(val => {
      if (!val) return [];
      return val.split(/[\,\s]+/).map(email => email.trim()).filter(Boolean);
    }),
}))

const slugify = (str: string) => str
  .toLowerCase()
  .replace(/ /g, '-')
  .replace(/[^\w-]+/g, '');


watch(isDialogOpen, (open) => {
  if (!open) {
    stepIndex.value = 1
    formRef.value?.resetForm?.()
  }
})

async function handleSubmit(values: any) {
  if (stepIndex.value === 1) {
    stepIndex.value = 2
    return
  }
  isLoading.value = true
  try {
    // Create workspace
    const res = await addWorkspace({
      name: values.name,
      slug: slugify(values.name),
      metadata: {
        description: values.description,
      },
    })
    if (res.error) {
      toast.error(res.error.statusText)
      return
    }
    // Invite members if emails provided
    const emailList = values.emails.split(',') ?? []
    if (emailList.length > 0) {
      try {
        for (const email of emailList) {
          await authClient.organization.inviteMember({
            organizationId: res.data.id,
            email,
            role: 'member'
          })
        }
        toast.success(`${emailList.length} membres ont été invités`)
      } catch (inviteError) {
        console.error('Error inviting members:', inviteError)
        toast.error('Erreur lors de l\'invitation des membres')
      }
    }
    isDialogOpen.value = false
    stepIndex.value = 1
    toast.success(`Espace de travail "${res.data.name}" créé avec succès`)
    await switchWorkspace(res.data.id)
  } catch (error) {
    console.error('Error creating workspace:', error)
    toast.error('Erreur lors de la création de l\'espace de travail')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>