<script setup lang="ts">
import {Button} from '~/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '~/components/ui/card'
import {Input} from '~/components/ui/input'
import {Label} from '~/components/ui/label'
//import { AlertDescription } from '@/components/ui/alert'

/*
definePageMeta({
  auth: { authenticatedOnly: false, navigateAuthenticatedTo: '/app/dashboard' }
})

 */

const {signIn, getProviders, status} = useAuth()
const providers = await getProviders()
console.log(status.value)
const signUpUserInfo = ref({
  name: '',
  firstName: '',
  email: '',
  password: ''
})

const router = useRouter()
const message = ref({
  type: '',
  text: ''
})

const isLoading = ref(false)
const signUp = async () => {

  isLoading.value = true


  const res = await useFetch('/api/auth/sign-up', {
    method: 'POST',
    body: JSON.stringify(signUpUserInfo.value)
  })


  if (res.data.value.status === 200) {
    message.value = {type: 'success', text: res.data.value.body.message}
    setTimeout(() => {
      isLoading.value = false
    }, 5000)
      //message.value = {text: "", type: ""}

    const userLogged = await signIn('credentials',{email: signUpUserInfo.value.email, password: signUpUserInfo.value.password, callbackUrl: '/app/dashboard'})

    if(userLogged) {
      await router.push({path: "/"})
    }

  } else {
    message.value = {type: 'error', text: res.data.value.body.error}
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
          <div class="grid gap-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="grid gap-2">
                <Label for="first-name">Prénom</Label>
                <Input v-model="signUpUserInfo.firstName" id="first-name" placeholder="Max" required/>
              </div>
              <div class="grid gap-2">
                <Label for="last-name">Nom</Label>
                <Input v-model="signUpUserInfo.name" id="last-name" placeholder="Robinson" required/>
              </div>
            </div>
            <div class="grid gap-2">
              <Label for="email">Email</Label>
              <Input
                  v-model="signUpUserInfo.email"
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  required
              />
            </div>
            <div class="grid gap-2">
              <Label for="password">Mot de passe</Label>
              <Input
                  v-model="signUpUserInfo.password"
                  id="password" type="password"/>
            </div>
            <div v-if="message.type !== ''">
              <div v-if="message.type === 'error'">
                <div class="w-full">
                  <div class="flex justify-between p-4 rounded-md bg-red-50 border border-red-300">
                    <div class="flex gap-3 sm:items-center">
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none"
                             viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <p class="text-red-600 sm:text-sm">
                        {{ message.text }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="message.type === 'success'">
                <div class="w-full">
                  <div class="flex justify-between items-center p-4 rounded-md bg-green-50 border border-green-300">
                    <div class="flex items-start gap-3 w-full">
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div class="flex-1 self-center">
                        <div class="text-green-600">
                          <p class=" sm:text-sm">
                            {{ message.text }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Button @click="signUp" type="submit" class="w-full" :disabled="isLoading">
              <div v-if="isLoading" class="animate-spin inline-block size-4 border-[2px] border-current border-t-transparent mx-3  text-white rounded-full" role="status" aria-label="loading">
                <span class="sr-only">Chargement...</span>
              </div>
              S'inscrire
            </Button>
            <Button class="w-full" variant="outline" v-for="provider in filteredProviders" :key="provider?.id"
                    @click="signIn(provider?.id, { callbackUrl: '/app/dashboard' })">
              Se connecter avec {{ provider?.name }}
            </Button>
          </div>
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