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
                  <div class="flex justify-start p-4 gap-x-2 rounded-md bg-red-50 border border-red-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-red-600">{{ message.text }}</p>
                  </div>
                </div>

                <div v-if="message.type === 'success'" class="w-full">
                  <div class="flex justify-start p-4 gap-x-2 rounded-md bg-green-50 border border-green-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-green-600">{{ message.text }}</p>
                  </div>
                </div>
              </div>

              <Button type="submit" :disabled="isLoading">
                <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin"/>
                {{ isLoading ? "Chargement..." : "S'inscrire" }}
              </Button>

              <!-- <div v-for="provider in filteredProviders" :key="provider?.id" class="w-full">
                <Button  class="w-full" variant="outline" @click="signInProvider(provider.id)">
                  Continuer avec {{ provider?.name }}
                </Button>
              </div> -->
            </div>
          </Form>

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
import {Button} from '~/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '~/components/ui/card'
import {Input} from '~/components/ui/input'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from '@/components/ui/form'

import {Loader2} from "lucide-vue-next";

import {useForm} from 'vee-validate'
import {toTypedSchema} from "@vee-validate/zod";
import {z} from "zod/v4";

import {authClient, signUp} from "~/lib/auth-client.js";

const route = useRoute()

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
  });
  
  if (res.error) {
    message.value.type = 'error';
    message.value.text = res.error.message || "";
    isLoading.value = false;
  } else {
    // Wait for session to load
    const { data: session } = await authClient.getSession()

    // Check for redirect parameter (e.g. invitation link)
    const redirect = route.query.redirect

    if (redirect) {
      await navigateTo(decodeURIComponent(redirect))
    } else {
      // Default redirect to dashboard
      const orgId = session?.session?.activeOrganizationId
      if (orgId) {
        const url = getDashboardUrl(orgId)
        await navigateTo(url)
      }
    }
  }
};

const signInProvider = async (providerId) => {
  isLoading.value = true
  try {
    const res = await signIn(providerId)
    if (res?.error) {
      console.error("Erreur de connexion avec le provider:", res.error)
      // Gérer l'erreur de connexion ici, par exemple en affichant un message d'erreur
    } else {
      // Redirection réussie
      await refresh()
      return navigateTo(goToDashboard())
    }
  } catch (error) {
    console.error("Erreur lors de la connexion avec le provider:", error)
  } finally {
    isLoading.value = false
  }
}

// const filteredProviders = computed(() => {
//   return Object.keys(providers)
//       .filter(key => key !== 'credentials')
//       .reduce((result, key) => {
//         result[key] = providers[key]
//         return result
//       }, {})
// })
</script>