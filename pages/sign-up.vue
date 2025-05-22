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
          <form @submit="signUp">
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

              <FormField name="button-submit">
                <FormControl class="w-full">
                  <Button type="submit" :disabled="isLoading">
                    <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin"/>
                    {{ isLoading ? "Chargement..." : "S'inscrire" }}
                  </Button>
                </FormControl>
              </FormField>

              <div v-for="provider in filteredProviders" :key="provider?.id" class="w-full">
                <Button  class="w-full" variant="outline" @click="signIn(provider?.id, { callbackUrl: '/app' })">
                  Continuer avec {{ provider?.name }}
                </Button>
              </div>
            </div>
          </form>

          <div class="mt-4 text-center text-sm">
            Vous avez déjà un compte ?
            <NuxtLink to="/sign-in" class="underline">
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import {Loader2} from "lucide-vue-next";

import { useForm } from 'vee-validate'
import {toTypedSchema} from "@vee-validate/zod";
import { z } from "zod/v4";
import { useUser } from '~/composables/api/useUser';


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
  email: z.string({
    error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : ""
  }).email({ message: "Adresse email invalide." }),
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


const {signIn, getProviders, status} = useAuth()
const providers = await getProviders()

const router = useRouter()
const message = ref({
  type: '',
  text: ''
})

const { addUser } = useUser()
const isLoading = ref(false)
const signUp = form.handleSubmit(async (values) => {
  isLoading.value = true

  const res = await addUser(values)
  console.log("res", res);
   


  if (res.status === 200) {
    message.value = {type: 'success', text: res.body.message}
    setTimeout(() => {
      isLoading.value = false
    }, 5000)
    message.value = {text: "", type: ""}

    console.log("now sign in");
    
    
    await signIn('credentials',{email: values.email, password: values.password, callbackUrl: '/app'})


  } else {
    message.value = {type: 'error', text: res.body.error}
    isLoading.value = false
  }
})

const filteredProviders = computed(() => {
  return Object.keys(providers)
      .filter(key => key !== 'credentials')
      .reduce((result, key) => {
        result[key] = providers[key]
        return result
      }, {})
})
</script>