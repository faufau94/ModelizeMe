<template>
  <div class="min-h-screen flex flex-col">
    <header class="px-4 lg:px-6 h-14 flex items-center justify-between">
      <NuxtLink class="flex items-center" to="/">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-6 w-6"
        >
          <path d="m8 3 4 8 5-5 5 15H2L8 3z"></path>
        </svg>
        <span class="text-xl font-bold ml-2">ModelizeMe</span>
      </NuxtLink>
    </header>
    <div class="flex-grow flex justify-center items-center">
      <Card class="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle class="text-2xl">Réinitialiser le mot de passe</CardTitle>
          <CardDescription>
            Choisissez un nouveau mot de passe pour votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <!-- Invalid/expired token -->
          <div v-if="tokenError" class="space-y-4">
            <div class="flex justify-start p-4 gap-x-2 rounded-md bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800">
              <AlertCircle class="h-6 w-6 text-red-500 shrink-0" />
              <p class="text-red-600 dark:text-red-400">Le lien de réinitialisation est invalide ou a expiré.</p>
            </div>
            <Button as-child class="w-full">
              <NuxtLink to="/forgot-password">Demander un nouveau lien</NuxtLink>
            </Button>
          </div>

          <!-- Success -->
          <div v-else-if="success" class="space-y-4">
            <div class="flex justify-start p-4 gap-x-2 rounded-md bg-green-50 dark:bg-green-950/50 border border-green-300 dark:border-green-800">
              <CheckCircle2 class="h-6 w-6 text-green-500 shrink-0" />
              <p class="text-green-600 dark:text-green-400">Votre mot de passe a été réinitialisé avec succès.</p>
            </div>
            <Button as-child class="w-full">
              <NuxtLink to="/sign-in">Se connecter</NuxtLink>
            </Button>
          </div>

          <!-- Reset form -->
          <Form
            v-else
            as="form"
            :validation-schema="formSchema"
            @submit="onSubmit"
          >
            <div class="grid gap-4">
              <FormField name="newPassword" v-slot="{ field }">
                <FormItem>
                  <FormLabel for="new-password">Nouveau mot de passe</FormLabel>
                  <FormControl>
                    <Input v-bind="field" id="new-password" type="password" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField name="confirmPassword" v-slot="{ field }">
                <FormItem>
                  <FormLabel for="confirm-password">Confirmer le mot de passe</FormLabel>
                  <FormControl>
                    <Input v-bind="field" id="confirm-password" type="password" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <div v-if="errorMessage" class="w-full">
                <div class="flex justify-start p-4 gap-x-2 rounded-md bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800">
                  <AlertCircle class="h-6 w-6 text-red-500" />
                  <p class="text-red-600 dark:text-red-400">{{ errorMessage }}</p>
                </div>
              </div>

              <Button type="submit" :disabled="isLoading">
                <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                {{ isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe" }}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-vue-next'

import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod/v4'

import { authClient } from '~/lib/auth-client'

const route = useRoute()

const token = computed(() => route.query.token)
const tokenError = computed(() => route.query.error === 'INVALID_TOKEN' || !token.value)

const formSchema = toTypedSchema(z.object({
  newPassword: z.string().min(6, 'Le mot de passe doit être supérieur à 6 caractères.'),
  confirmPassword: z.string().min(6, 'Le mot de passe doit être supérieur à 6 caractères.'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe doivent correspondre.',
  path: ['confirmPassword'],
}))

const isLoading = ref(false)
const success = ref(false)
const errorMessage = ref('')

const onSubmit = async (values) => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { error } = await authClient.resetPassword({
      newPassword: values.newPassword,
      token: token.value,
    })

    if (error) {
      errorMessage.value = error.message || "Une erreur est survenue."
    } else {
      success.value = true
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Une erreur est survenue."
  } finally {
    isLoading.value = false
  }
}
</script>
