<template>

  <div class="min-h-screen flex flex-col">
    <header class="px-4 lg:px-6 h-14 flex items-center justify-between">
      <NuxtLink class="flex items-center" to="/">
        <img src="/favicon.svg" class="h-7 w-7" alt="" aria-hidden="true" />
        <span class="text-xl font-bold ml-2">{{ appName }}</span>
      </NuxtLink>
    </header>
    <div class="flex-grow flex justify-center items-center">
      <Card class="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle class="text-xl">
            Inscription
          </CardTitle>
          <CardDescription>
            Entrez vos informations pour créer un compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form
              as="form"
              :validation-schema="formSchema"
              @submit="onSubmit"
              v-slot="{ errors }"
            >
            <div class="grid gap-4">
              <div class="grid grid-cols-2 gap-4">
                <FormField v-slot="{ componentField }" name="firstName">
                  <FormItem>
                    <FormLabel for="first-name">Prénom</FormLabel>
                    <FormControl>
                      <Input v-bind="componentField" id="first-name" placeholder="Max" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="name">
                  <FormItem>
                    <FormLabel for="last-name">Nom</FormLabel>
                    <FormControl>
                      <Input v-bind="componentField" id="last-name" placeholder="Robinson" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>

              <FormField v-slot="{ componentField }" name="email">
                <FormItem>
                  <FormLabel for="email">Email</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" id="email" type="email" placeholder="john@example.com" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="password">
                <FormItem>
                  <FormLabel for="password">Mot de passe</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" id="password" type="password" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="confirmPassword">
                <FormItem>
                  <FormLabel for="confirm-password">Confirmer le mot de passe</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" id="confirm-password" type="password" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <div v-if="message.type !== ''">
                <div v-if="message.type === 'error'" class="w-full">
                  <div class="flex justify-start p-4 gap-x-2 rounded-md bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800">
                    <AlertCircle class="h-6 w-6 text-red-500 shrink-0" />
                    <p class="text-red-600 dark:text-red-400">{{ message.text }}</p>
                  </div>
                </div>

                <div v-if="message.type === 'success'" class="w-full">
                  <div class="flex justify-start p-4 gap-x-2 rounded-md bg-green-50 dark:bg-green-950/50 border border-green-300 dark:border-green-800">
                    <CheckCircle2 class="h-6 w-6 text-green-500 shrink-0" />
                    <p class="text-green-600 dark:text-green-400">{{ message.text }}</p>
                  </div>
                </div>
              </div>

              <Button type="submit" :disabled="isLoading || isLoadingProvider">
                <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin"/>
                {{ isLoading ? "Chargement..." : "S'inscrire" }}
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
            Vous avez déjà un compte ?
            <NuxtLink :to="route.query.redirect ? `/sign-in?redirect=${route.query.redirect}` : '/sign-in'" class="underline">
              Se connecter
            </NuxtLink>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
const appName = useAppName()
import {Button} from '~/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '~/components/ui/card'
import {Input} from '~/components/ui/input'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from '@/components/ui/form'

import {AlertCircle, CheckCircle2, Loader2} from "lucide-vue-next";

import {useForm} from 'vee-validate'
import {toTypedSchema} from "@vee-validate/zod";
import {z} from "zod/v4";

import {authClient, signUp} from "~/lib/auth-client.js";

const route = useRoute()

const socialProviders = [
  { id: 'google', name: 'Google' },
  { id: 'github', name: 'GitHub' },
  { id: 'gitlab', name: 'GitLab' },
]

const isLoadingProvider = ref(false)

const formSchema = toTypedSchema(z.object({
  name: z.string({
    error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : ""
  }).min(2, 'Le nom doit être supérieur à 2 caractères.').max(50),
  firstName: z.string({
    error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : ""
  }).min(2, 'Le nom doit être supérieur à 2 caractères.').max(50),
  email: z
      .string({error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : ""})
      .nonempty("Veuillez remplir le champ.")
      // .refine(
      //   // la fonction doit renvoyer true (valide) ou false (erreur)
      //   async (email) => {
      //     const res = await $fetch("/api/auth/email-exists", {
      //       method: "GET",
      //       params: { email },
      //     })
      //     // on suppose que GET /api/users?email=… → { exists: boolean }
      //     return !res.body.exists
      //   },
      //   { message: "Cet email est déjà utilisé." }
      // )
      ,
  password: z.string({
    error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : ""
  }).min(6, 'Le mot de passe doit être supérieur à 6 caractères.'),
  confirmPassword: z.string({
    error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : ""
  }).min(6, 'Le mot de passe doit être supérieur à 6 caractères.'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Les mots de passe doivent correspondre.',
  path: ['confirmPassword'],
}))

const form = useForm({
  validationSchema: formSchema,
})


// const {signIn, getProviders, refresh} = useAuth()
// const providers = await getProviders()

const message = ref({
  type: '',
  text: ''
})

const isLoading = ref(false)
const onSubmit = async (values) => {
  isLoading.value = true;
  
  const res = await signUp.email({
    email: values.email,
    password: values.password,
    name: values.name,
    callbackURL: '/welcome',
  });
  
  if (res.error) {
    message.value.type = 'error';
    message.value.text = res.error.message || "";
    isLoading.value = false;
  } else {
    // Email verification is required — show success message
    message.value.type = 'success';
    message.value.text = 'Un email de vérification a été envoyé. Vérifiez votre boîte de réception pour activer votre compte.';
    isLoading.value = false;
  }
};

const signInProvider = async (providerId) => {
  isLoadingProvider.value = true
  try {
    const redirect = route.query.redirect
    await authClient.signIn.social({
      provider: providerId,
      callbackURL: redirect ? decodeURIComponent(redirect) : "/",
      errorCallbackURL: "/sign-up",
      newUserCallbackURL: "/welcome",
    })
  } catch (error) {
    message.value.type = 'error'
    message.value.text = error instanceof Error ? error.message : 'Erreur lors de la connexion avec le provider.'
  } finally {
    isLoadingProvider.value = false
  }
}
</script>