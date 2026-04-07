<template>
  <Dialog v-model:open="isCreateModelDialogOpen">
    <DialogTrigger as-child>
      <Button>
        <CirclePlus :size="20" class="mr-2" />
        Nouveau modèle
      </Button>
    </DialogTrigger>

    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Nouveau modèle</DialogTitle>
        <DialogDescription>
          Ajouter un nouveau modèle.
        </DialogDescription>
      </DialogHeader>

      <Form
        v-slot="{ handleSubmit, meta, resetForm, errors, values }"
        :validation-schema="formSchema"
        as=""
      >
        <form
          class="space-y-4"
          @submit.prevent="handleSubmit((formValues) => onSubmit(formValues, { resetForm }))()"
        >
          <FormField
            v-slot="{ componentField }"
            name="title"
            :validate-on-blur="false"
          >
            <FormItem>
              <FormLabel>Nom</FormLabel>

              <FormControl>
                <Input
                  type="text"
                  v-bind="componentField"
                />
              </FormControl>

              <FormDescription>
                Il pourra toujours être modifié plus tard.
              </FormDescription>

              <div class="min-h-[20px]">
                <FormMessage />
              </div>
            </FormItem>
          </FormField>

          <div class="flex justify-end">
            <Button
              type="submit"
              :disabled="isSubmitDisabled(meta, values, errors)"
            >
              <Loader2
                v-if="isLoadingNewModel"
                class="w-4 h-4 mr-2 animate-spin"
              />
              {{ isLoadingNewModel ? 'Ajout...' : 'Ajouter' }}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { CirclePlus, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { useModel } from '@/composables/api/useModel'
import { useWorkspaceStore } from '@/stores/api/workspace-store'

const formSchema = toTypedSchema(
  z.object({
    title: z
      .string({
        error: (issue) =>
          issue.input === undefined ? 'Veuillez remplir le champs.' : '',
      })
      .min(2, 'Le nom doit être supérieur à 2 caractères.')
      .max(50, 'Le nom doit contenir au maximum 50 caractères.'),
  }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    title: '',
  },
})

const { addModel } = useModel()
const workspaceStore = useWorkspaceStore()
const { selectedWorkspaceId } = storeToRefs(workspaceStore)

const isCreateModelDialogOpen = ref(false)
const isLoadingNewModel = ref(false)

const isSubmitDisabled = (meta: { valid: boolean; dirty: boolean }, values: { title?: string }, errors: Record<string, string | string[] | undefined>) => {
  const title = values.title?.trim() ?? ''
  const hasTitleError = !!errors.title
  return isLoadingNewModel.value || title.length === 0 || hasTitleError || !meta.dirty || !meta.valid
}

watch(isCreateModelDialogOpen, (open) => {
  if (!open) {
    form.resetForm()
    isLoadingNewModel.value = false
  }
})

const onSubmit = async (
  values: { title: string },
  { resetForm }: { resetForm: () => void },
) => {
  isLoadingNewModel.value = true

  try {
    const res = await addModel({
      ...values,
      selectedWorkspaceId: selectedWorkspaceId.value,
    })

    resetForm()
    isCreateModelDialogOpen.value = false
    await navigateTo(`/app/model/${res.id}`)
  } catch (err: any) {
    toast.error(err?.data?.message || 'Erreur lors de la création du modèle')
  } finally {
    isLoadingNewModel.value = false
  }
}
</script>