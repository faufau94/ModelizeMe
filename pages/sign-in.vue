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
          <CardTitle class="text-2xl">
            Connexion
          </CardTitle>
          <CardDescription>
            Connectez-vous à votre compte
          </CardDescription>
          <div v-if="showInviteMessage" class="mt-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
            Connectez-vous pour rejoindre l'espace de travail
          </div>
        </CardHeader>
        <CardContent>

          <Form
              as="form"
              :validation-schema="formSchema"
              @submit="onSubmit"
              v-slot="{ errors }"
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

              <FormField name="password" v-slot="{ field }">
                <FormItem>
                  <FormLabel for="password">Mot de passe</FormLabel>
                  <FormControl>
                    <Input v-bind="field" id="password" type="password" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <NuxtLink to="/forgot-password" class="text-sm underline text-muted-foreground hover:text-foreground">
                Mot de passe oublié ?
              </NuxtLink>

              <div v-if="message && message.type === 'error'" class="w-full">
                <div class="flex justify-start p-4 gap-x-2 rounded-md bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800">
                  <AlertCircle class="h-6 w-6 text-red-500" />
                  <p class="text-red-600 dark:text-red-400">{{ message.text }}</p>
                </div>
              </div>

              <div v-if="message && message.type === 'warning'" class="w-full">
                <div class="flex justify-start p-4 gap-x-2 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800">
                  <AlertCircle class="h-6 w-6 text-amber-500" />
                  <p class="text-amber-700 dark:text-amber-400">{{ message.text }}</p>
                </div>
              </div>

              <Button type="submit" :disabled="isLoading || isLoadingProvider">
                <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin"/>
                {{ isLoading ? "Chargement..." : "Se connecter" }}
              </Button>
            </div>
          </Form>

          <div class="my-4">
            <div v-for="provider in socialProviders" :key="provider.id" class="w-full py-2">
              <Button class="w-full" variant="outline" :disabled="isLoadingProvider || isLoading" @click="signInProvider(provider.id)">
                <Loader2 v-if="isLoadingProvider" class="w-4 h-4 mr-2 animate-spin"/>
                Continuer avec {{ provider.name }}
              </Button>
            </div>
          </div>

          <div class="mt-4 text-center text-sm">
            Pas encore de compte ?
            <NuxtLink :to="route.query.redirect ? `/sign-up?redirect=${route.query.redirect}` : '/sign-up'" class="underline">
              S'inscrire
            </NuxtLink>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>


</template>

<script setup lang="ts">
import {Button} from '~/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '~/components/ui/card'
import {Input} from '~/components/ui/input'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from '@/components/ui/form'

import {AlertCircle, Loader2} from "lucide-vue-next";

import {useForm} from 'vee-validate'
import {toTypedSchema} from "@vee-validate/zod";
import {z} from "zod/v4";

import {authClient, signIn} from "~/lib/auth-client.js";
import {computed} from 'vue'

const formSchema = toTypedSchema(z.object({
  email: z.email({message: "Adresse email invalide."}),
  password: z.string({
    error: (issue) => issue.input === undefined
    ? "Veuillez remplir le champs." 
    : ""
  }).min(6, 'Le mot de passe doit être supérieur à 6 caractères.')
}))

const form = useForm({
  validationSchema: formSchema,
})

const message = ref({
  type: '',
  text: ''
})

const isLoading = ref(false)
const isLoadingProvider = ref(false)

const socialProviders = [
  { id: 'google', name: 'Google' },
  { id: 'github', name: 'GitHub' },
  { id: 'gitlab', name: 'GitLab' },
] as const

const authErrorMessages: Record<string, { type: string; text: string }> = {
  'Invalid email or password': { type: 'error', text: 'Email ou mot de passe incorrect.' },
  'Email not verified': { type: 'warning', text: 'Veuillez vérifier votre adresse email avant de vous connecter. Consultez votre boîte de réception.' },
  'Too many requests': { type: 'error', text: 'Trop de tentatives. Veuillez réessayer plus tard.' },
  'User not found': { type: 'error', text: 'Aucun compte trouvé avec cet email.' },
}

const translateAuthError = (error: { status?: number; message?: string }) => {
  if (error.status === 403) {
    return { type: 'warning', text: 'Veuillez vérifier votre adresse email avant de vous connecter. Consultez votre boîte de réception.' }
  }
  return authErrorMessages[error.message || ''] || { type: 'error', text: 'Une erreur est survenue. Veuillez réessayer.' }
}

const onSubmit = async (values: { email: string; password: string }) => {
  isLoading.value = true

  const result = await signIn.email(
    {
      email: values.email,
      password: values.password,
    },
    {
      onError(context) {
        const translated = translateAuthError(context.error)
        message.value.type = translated.type
        message.value.text = translated.text
        isLoading.value = false
      },
    },
  )

  if (result.error) {
    const translated = translateAuthError(result.error)
    message.value.type = translated.type
    message.value.text = translated.text
    isLoading.value = false
    
  } else {


  // Wait for session to load
  const { data: session } = await authClient.getSession()

  // Check for redirect parameter
  const route = useRoute()
  const redirect = route.query.redirect as string | undefined

  if (redirect) {
    await navigateTo(decodeURIComponent(redirect))
  } else {
    // Default redirect to dashboard
    const orgId = session?.session?.activeOrganizationId
    if (orgId) {
      const url = `/app/workspace/${orgId}`
      await navigateTo(url)
    }
  }
}

}

const signInProvider = async (providerId: typeof socialProviders[number]['id']) => {
  isLoadingProvider.value = true;
  try {
    const route = useRoute()
    const redirect = route.query.redirect as string | undefined
    
    await authClient.signIn.social({
      provider: providerId,
      callbackURL: redirect ? decodeURIComponent(redirect) : "/",
      errorCallbackURL: "/sign-in",
      newUserCallbackURL: "/welcome",
    });
  } catch (error) {
    message.value.type = 'error';
    message.value.text = error instanceof Error ? error.message : 'Erreur lors de la connexion avec le provider.';
  } finally {
    isLoadingProvider.value = false;
  }
};

// const filteredProviders = computed(() => {
//   return Object.keys(providers)
//       .filter(key => key !== 'credentials')
//       .reduce((result, key) => {
//         result[key] = providers[key]
//         return result
//       }, {})
// })

const route = useRoute()

// Afficher un message si l'utilisateur vient d'une invitation
const showInviteMessage = computed(() => {
  const redirect = route.query.redirect as string | undefined
  return redirect?.includes('/workspace/join/')
})
</script>
