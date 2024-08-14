<script setup lang="ts">
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
/*
definePageMeta({
  auth: { unauthenticatedOnly: true, navigateAuthenticatedTo: '/dashboard' }
})

 */

const { signIn, getProviders } = useAuth()
const providers = await getProviders()

const logUserInfo = ref({
  email: '',
  password: ''
})

const onSubmit = async () => {
  const res = await signIn('credentials', {
    email: logUserInfo.value.email,
    password: logUserInfo.value.password,
    callbackUrl: '/dashboard'
  })

  console.log(res)
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
          <div class="grid gap-4">
            <div class="grid gap-2">
              <Label for="email">Email</Label>
              <Input
                  v-model="logUserInfo.email"
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  required
              />
            </div>
            <div class="grid gap-2">
              <div class="flex items-center">
                <Label for="password">Mot de passe</Label>
                <!--
                <a href="#" class="ml-auto inline-block text-sm underline">
                  Mot de passe oublié ?
                </a>
                -->
              </div>
              <Input
                  v-model="logUserInfo.password"
                  id="password"
                  type="password"
                  required
              />
            </div>
            <Button type="submit" class="w-full"
                    @click="() => onSubmit()">
              Se connecter
            </Button>

            <Button class="w-full" variant="outline" v-for="provider in filteredProviders" :key="provider?.id" @click="async () => await signIn(provider?.id, { callbackUrl: '/dashboard' })">
              Se connecter avec {{ provider?.name }}
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