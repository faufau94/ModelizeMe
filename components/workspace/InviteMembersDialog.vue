<template>
  <div>
    <Dialog v-model:open="isDialogOpen">
      <DialogTrigger as-child>
        <Button
          size="lg"
          class="hidden md:flex items-center gap-2 transition-colors px-4 bg-white dark:bg-card"
          variant="outline"
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
          v-slot="{ meta, values, errors }"
          :validation-schema="formSchema"
          as=""
        >
          <form class="mt-4 space-y-4" @submit="onSubmit">
            <FormField
              name="emails"
              :validate-on-blur="false"
              v-slot="{ componentField }"
            >
              <FormItem>
                <FormLabel>Adresses email</FormLabel>

                <FormControl>
                  <Textarea
                    v-bind="componentField"
                    rows="3"
                    placeholder="Entrez ou collez une ou plusieurs adresses email, séparées par des espaces ou des virgules"
                  />
                </FormControl>

                <FormDescription>
                  Vous pouvez inviter plusieurs personnes en même temps.
                </FormDescription>

                <div class="min-h-[20px]">
                  <FormMessage />
                </div>
              </FormItem>
            </FormField>

            <div class="flex items-center justify-end">
              <Button
                type="submit"
                :disabled="isSubmitDisabled(meta, values, errors)"
              >
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
import { ref, watch } from 'vue'
import { z } from 'zod'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Loader2, Plus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import { useWorkspace } from '@/composables/api/useWorkspace'
import { useMember } from '~/composables/api/useMember'

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

const { selectedWorkspaceId } = useWorkspace()
const { addMember } = useMember()

const isDialogOpen = defineModel<boolean>('open', { default: false })
const isLoading = ref(false)

const formSchema = toTypedSchema(
  z.object({
    emails: z
      .string()
      .trim()
      .min(1, 'Veuillez entrer au moins une adresse email')
      .transform((value) =>
        value
          .split(/[,\s]+/)
          .map((email) => email.trim())
          .filter(Boolean),
      )
      .pipe(
        z
          .array(
            z.string().email('Une ou plusieurs adresses email sont invalides'),
          )
          .min(1, 'Veuillez entrer au moins une adresse email'),
      ),
  }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    emails: '',
  },
})

watch(isDialogOpen, (open) => {
  if (!open) {
    form.resetForm()
    isLoading.value = false
  }
})

function isSubmitDisabled(
  meta: { valid: boolean; dirty: boolean },
  values: { emails?: string },
  errors: Record<string, string | string[] | undefined>,
) {
  const rawEmails = values.emails?.trim() ?? ''
  const hasEmailsError = !!errors.emails

  return (
    isLoading.value ||
    rawEmails.length === 0 ||
    hasEmailsError ||
    !meta.dirty ||
    !meta.valid
  )
}

const onSubmit = form.handleSubmit(async (values) => {
  if (!selectedWorkspaceId.value) {
    toast.error('Aucun espace de travail sélectionné')
    return
  }

  isLoading.value = true

  try {
    const emailList = values.emails
    let successCount = 0
    let errorCount = 0

    for (const email of emailList) {
      try {
        await addMember({
          email,
          selectedWorkspaceId: selectedWorkspaceId.value,
        })
        successCount++
      } catch (error) {
        console.error('Error inviting member:', email, error)
        errorCount++
      }
    }

    if (successCount > 0) {
      toast.success(
        `${successCount} invitation${successCount > 1 ? 's' : ''} envoyée${successCount > 1 ? 's' : ''}`,
      )
    }

    if (errorCount > 0) {
      toast.error(
        `${errorCount} invitation${errorCount > 1 ? 's ont' : ' a'} échoué`,
      )
    }

    if (successCount > 0 && errorCount === 0) {
      form.resetForm()
      isDialogOpen.value = false
    }
  } catch (error) {
    console.error('Error sending invitations:', error)
    toast.error("Erreur lors de l'envoi des invitations")
  } finally {
    isLoading.value = false
  }
})
</script>