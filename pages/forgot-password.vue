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
          <CardTitle class="text-2xl">Mot de passe oublié</CardTitle>
          <CardDescription>
            Entrez votre email pour recevoir un lien de réinitialisation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="success" class="flex justify-start p-4 gap-x-2 rounded-md bg-green-50 dark:bg-green-950/50 border border-green-300 dark:border-green-800">
            <CheckCircle2 class="h-6 w-6 text-green-500 shrink-0" />
            <p class="text-green-600 dark:text-green-400">Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.</p>
          </div>

          <Form
            v-else
            as="form"
            :validation-schema="formSchema"
            @submit="onSubmit"
          >
            <div class="grid gap-4">
              <FormField name="email" v-slot="{ field }">
                <FormItem>
                  <FormLabel for="email">Email</FormLabel>
                  <FormControl>
                    <Input v-bind="field" id="email" type="email" placeholder="john@example.com" required />
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
                {{ isLoading ? "Envoi en cours..." : "Envoyer le lien" }}
              </Button>
            </div>
          </Form>

          <div class="mt-4 text-center text-sm">
            <NuxtLink to="/sign-in" class="underline">Retour à la connexion</NuxtLink>
          </div>
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

const formSchema = toTypedSchema(z.object({
  email: z.email({ message: 'Adresse email invalide.' }),
}))

const isLoading = ref(false)
const success = ref(false)
const errorMessage = ref('')

const onSubmit = async (values) => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    await authClient.forgetPassword({
      email: values.email,
      redirectTo: '/reset-password',
    })
    success.value = true
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Une erreur est survenue."
  } finally {
    isLoading.value = false
  }
}
</script>
