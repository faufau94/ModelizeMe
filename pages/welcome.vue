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
        <span class="text-xl font-bold ml-2">{{ appName }}</span>
      </NuxtLink>
    </header>
    <div class="flex-grow flex justify-center items-center">
      <Card class="mx-auto max-w-md w-full text-center">
        <CardHeader>
          <div class="mx-auto mb-4">
            <PartyPopper class="h-12 w-12 text-primary" />
          </div>
          <CardTitle class="text-2xl">Bienvenue sur {{ appName }} !</CardTitle>
          <CardDescription>
            Votre compte a été créé avec succès. Vous allez être redirigé vers votre espace de travail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 class="h-4 w-4 animate-spin" />
            <span class="text-sm">Redirection en cours...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
const appName = useAppName()
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Loader2, PartyPopper } from 'lucide-vue-next'
import { authClient } from '~/lib/auth-client'

onMounted(async () => {
  // Let the user see the welcome message before redirecting
  await new Promise(resolve => setTimeout(resolve, 3000))

  try {
    const { data: session } = await authClient.getSession()
    const orgId = session?.session?.activeOrganizationId

    if (orgId) {
      await navigateTo(`/app/workspace/${orgId}`, { replace: true })
    } else {
      await navigateTo('/', { replace: true })
    }
  } catch {
    await navigateTo('/', { replace: true })
  }
})
</script>
