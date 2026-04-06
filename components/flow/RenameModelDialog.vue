<template>
  <Dialog v-model:open="showModel">
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
          @submit="handleSubmit((formValues) => onSubmit(formValues, { resetForm }))"
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
                  placeholder="Ex. Modèle A"
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
import { ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod/v4'
import { CirclePlus, Loader2 } from 'lucide-vue-next'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const showModel = ref(false)
const isLoadingNewModel = ref(false)

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

const isSubmitDisabled = (
  meta: { valid: boolean; dirty: boolean },
  values: { title?: string },
  errors: Record<string, string | string[] | undefined>,
) => {
  const title = values.title?.trim() ?? ''
  const hasTitleError = !!errors.title

  return (
    isLoadingNewModel.value ||
    title.length === 0 ||
    hasTitleError ||
    !meta.dirty ||
    !meta.valid
  )
}

watch(showModel, (open) => {
  if (!open) {
    form.resetForm()
    isLoadingNewModel.value = false
  }
})

const onSubmit = form.handleSubmit(async (values) => {
  isLoadingNewModel.value = true

  try {
    const res = await $fetch('/api/models/create', {
      method: 'POST',
      body: {
        title: values.title,
      },
    })

    form.resetForm()
    showModel.value = false

    await navigateTo('/app/model/' + res.id.toString())
  } finally {
    isLoadingNewModel.value = false
  }
})
</script>