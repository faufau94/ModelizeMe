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
          <form @submit.prevent="onSubmit">
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

              <FormField name="submit-button">
                <FormControl class="w-full">
                  <Button type="submit" :disabled="isLoading">
                    <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin"/>
                    {{ isLoading ? "Chargement..." : "Se connecter" }}
                  </Button>
                </FormControl>
              </FormField>

              <div v-for="provider in filteredProviders" :key="provider?.id" class="w-full">
                <Button class="w-full" variant="outline" @click="async () => await signIn(provider?.id, { callbackUrl: '/app' })">
                  Continuer avec {{ provider?.name }}
                </Button>
              </div>
            </div>
          </Form>
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

import {Loader2} from "lucide-vue-next";

import {useForm} from 'vee-validate'
import {toTypedSchema} from "@vee-validate/zod";
import * as z from "zod";

const formSchema = toTypedSchema(z.object({
  email: z.string({
    required_error: "Veuillez remplir le champs.",
  }).email({message: "Adresse email invalide."}),
  password: z.string({
    required_error: "Veuillez remplir le champs.",
  }).min(6, 'Le mot de passe doit être supérieur à 6 caractères.')
}))

const form = useForm({
  validationSchema: formSchema,
})

const {signIn, getProviders} = useAuth()
const providers = await getProviders()

const isLoading = ref(false)

const onSubmit = form.handleSubmit(async (values) => {
  const res = await signIn('credentials', {
    email: values.email,
    password: values.password,
    callbackUrl: '/app'
  })


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
