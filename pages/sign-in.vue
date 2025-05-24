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
        </CardHeader>
        <CardContent>
          <form @submit.prevent="onSubmit" class="py-2">
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
                  <div class="flex items-center">
                    <FormLabel for="password">Mot de passe</FormLabel>
                    <!--
                    <a href="#" class="ml-auto inline-block text-sm underline">
                      Mot de passe oublié ?
                    </a>
                    -->
                  </div>
                  <FormControl>
                    <Input v-bind="field" id="password" type="password" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <div v-if="message && message.type === 'error'" class="w-full">
                <div class="flex justify-start p-4 gap-x-2 rounded-md bg-red-50 border border-red-300">
                  <AlertCircle class="h-6 w-6 text-red-500" />
                  <p class="text-red-600">{{ message.text }}</p>
                </div>
              </div>

              <FormField name="submit-button">
                <FormControl class="w-full">
                  <Button type="submit" :disabled="isLoading">
                    <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin"/>
                    {{ isLoading ? "Chargement..." : "Se connecter" }}
                  </Button>
                </FormControl>
              </FormField>
            </div>
          </form>

          <div v-for="provider in filteredProviders" :key="provider?.id" class="w-full py-2">
            <Button class="w-full" variant="outline" @click="signInProvider(provider.id)">
              Continuer avec {{ provider?.name }}
            </Button>
          </div>

          <div class="mt-4 text-center text-sm">
            Pas encore de compte ?
            <NuxtLink to="/sign-up" class="underline">
              S'inscrire
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import {AlertCircle, Loader2} from "lucide-vue-next";

import {useForm} from 'vee-validate'
import {toTypedSchema} from "@vee-validate/zod";
import { z } from "zod/v4";
import { useWorkspaceNavigation } from '~/composables/api/useWorkspaceNavigation';


const {goToDashboard} = useWorkspaceNavigation()

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

const {signIn, getProviders, refresh} = useAuth()
const providers = await getProviders()

const isLoading = ref(false)

const onSubmit = form.handleSubmit(async (values) => {
   const res = await signIn('credentials', {
    email: values.email,
    password: values.password,
    redirect: false,
  })


  if (res?.error) {
    message.value.type = 'error'
    message.value.text = res.error
  } else {
    // Redirection réussie
      await refresh()

      return navigateTo(goToDashboard())
  }
})

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

const filteredProviders = computed(() => {
  return Object.keys(providers)
      .filter(key => key !== 'credentials')
      .reduce((result, key) => {
        result[key] = providers[key]
        return result
      }, {})
})
</script>
