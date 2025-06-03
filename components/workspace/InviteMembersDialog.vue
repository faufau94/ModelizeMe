<template>
  <div>
    <Dialog v-model:open="isDialogOpen">
      <DialogTrigger as-child>
        <Button
          variant="outline"
          size="sm"
          class="hidden md:flex items-center gap-2 transition-colors"
          aria-live="polite"
        >
          <Plus class="w-4 h-4" />
          <span>Inviter des membres</span>
        </Button>
      </DialogTrigger>

      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Inviter des membres</DialogTitle>
          <DialogDescription>
            Invitez des membres à rejoindre votre espace de travail.
          </DialogDescription>
        </DialogHeader>
        <Form
          ref="formRef"
          v-slot="{ meta, values, validate }"
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
              <FormField name="emails" v-slot="{ componentField }">
                <FormItem>
                  <FormLabel>Adresses email</FormLabel>
                  <FormControl>
                    <Textarea
                      v-bind="componentField"
                      placeholder="Entrez ou collez une ou plusieurs adresses email, séparées par des espaces ou des virgules"
                      rows="3"
                    />
                  </FormControl>
                  <FormDescription>
                    Vous pouvez inviter plusieurs personnes en même temps.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>
            <div class="flex items-center justify-end mt-4">
              <Button type="submit" :disabled="isLoading">
                <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                {{ isLoading ? 'Envoi des invitations...' : 'Envoyer les invitations' }}
              </Button>
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { authClient } from '~/lib/auth-client'

const { selectedWorkspaceId } = useWorkspace()
const isDialogOpen = ref(false)
const isLoading = ref(false)
const formRef = ref<any>(null)

const formSchema = toTypedSchema(z.object({
  emails: z.string()
    .min(1, 'Veuillez entrer au moins une adresse email')
    .transform(val => {
      if (!val) return [];
      return val.split(/[\,\s]+/).map(email => email.trim()).filter(Boolean);
    }),
}))

watch(isDialogOpen, (open) => {
  if (!open) {
    formRef.value?.resetForm?.()
  }
})

async function handleSubmit(values: any) {
  if (!selectedWorkspaceId.value) {
    toast.error('Aucun espace de travail sélectionné')
    return
  }

  isLoading.value = true
  try {
    const emailList = values.emails.split(',') ?? []
    let successCount = 0
    let errorCount = 0

    if (emailList.length > 0) {
    for (const email of emailList) {
      try {
        await authClient.organization.inviteMember({
          organizationId: selectedWorkspaceId.value,
          email,
          role: 'member'
        })
        successCount++
      } catch (error) {
        console.error('Error inviting member:', email, error)
        errorCount++
      }
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} invitation${successCount > 1 ? 's' : ''} envoyée${successCount > 1 ? 's' : ''}`)
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} invitation${errorCount > 1 ? 's ont' : ' a'} échoué`)
    }

    if (successCount > 0 && errorCount === 0) {
      isDialogOpen.value = false
    }
  } catch (error) {
    console.error('Error sending invitations:', error)
    toast.error('Erreur lors de l\'envoi des invitations')
  } finally {
    isLoading.value = false
  }
}
</script> 