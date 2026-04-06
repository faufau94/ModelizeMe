<template>
  <div class="px-6 py-6 lg:px-8 max-w-4xl mx-auto w-full">
    <div class="max-w-3xl mx-auto space-y-6">
      <!-- Profile Info -->
      <Form v-slot="{ handleSubmit }" :initial-values="profileValues" :validation-schema="profileSchema" as="">
        <form @submit="handleSubmit($event, onUpdateProfile)">
          <Card>
            <CardHeader>
              <CardTitle class="text-base">Mon profil</CardTitle>
              <CardDescription>
                Gérez vos informations personnelles.
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <!-- Avatar -->
              <div class="flex items-center gap-4">
                <Avatar class="h-16 w-16 text-lg">
                  <AvatarImage v-if="session?.user?.image" :src="session.user.image" />
                  <AvatarFallback>{{ session?.user?.name?.charAt(0).toUpperCase() }}</AvatarFallback>
                </Avatar>
                <div>
                  <p class="text-sm font-medium">{{ session?.user?.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ session?.user?.email }}</p>
                </div>
              </div>

              <Separator />

              <FormField v-slot="{ componentField }" name="name">
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" placeholder="Votre nom" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </CardContent>
            <CardFooter>
              <Button type="submit" size="sm" :disabled="isUpdatingProfile">
                <Loader2 v-if="isUpdatingProfile" class="mr-2 h-4 w-4 animate-spin" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      <!-- Connected Accounts -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Comptes connectés</CardTitle>
          <CardDescription>
            Gérez les fournisseurs d'authentification liés à votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div v-for="provider in providers" :key="provider.id" class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center h-8 w-8 rounded-md border bg-muted/50 text-xs font-semibold">
                {{ provider.label.charAt(0) }}
              </div>
              <div>
                <p class="text-sm font-medium">{{ provider.label }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ linkedAccounts[provider.id] ? 'Connecté' : 'Non connecté' }}
                </p>
              </div>
            </div>
            <Badge :variant="linkedAccounts[provider.id] ? 'default' : 'outline'">
              {{ linkedAccounts[provider.id] ? 'Lié' : 'Non lié' }}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <!-- Change Password -->
      <Form v-slot="{ handleSubmit }" :validation-schema="passwordSchema" as="">
        <form @submit="handleSubmit($event, onChangePassword)">
          <Card>
            <CardHeader>
              <CardTitle class="text-base">Changer le mot de passe</CardTitle>
              <CardDescription>
                Mettez à jour votre mot de passe. Laissez vide si vous ne souhaitez pas le changer.
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <FormField v-slot="{ componentField }" name="currentPassword">
                <FormItem>
                  <FormLabel>Mot de passe actuel</FormLabel>
                  <FormControl>
                    <Input type="password" v-bind="componentField" placeholder="••••••••" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="newPassword">
                <FormItem>
                  <FormLabel>Nouveau mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" v-bind="componentField" placeholder="••••••••" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="confirmPassword">
                <FormItem>
                  <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" v-bind="componentField" placeholder="••••••••" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </CardContent>
            <CardFooter>
              <Button type="submit" size="sm" :disabled="isChangingPassword">
                <Loader2 v-if="isChangingPassword" class="mr-2 h-4 w-4 animate-spin" />
                Changer le mot de passe
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      <!-- Theme -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Apparence</CardTitle>
          <CardDescription>
            Personnalisez l'apparence de l'application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground mr-2">Thème</span>
            <div class="flex items-center gap-0.5 rounded-md border border-border p-0.5">
              <button
                v-for="option in themeOptions"
                :key="option.value"
                class="rounded p-1.5 transition-colors cursor-pointer"
                :class="colorMode.preference === option.value
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground'"
                @click="setTheme(option.value, $event)"
              >
                <component :is="option.icon" class="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Danger Zone -->
      <Card class="border-destructive/50">
        <CardHeader>
          <CardTitle class="text-base text-destructive">Zone de danger</CardTitle>
          <CardDescription>
            Supprimez définitivement votre compte et toutes vos données. Cette action est irréversible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="destructive" size="sm">
                <Trash2 class="mr-2 h-4 w-4" />
                Supprimer mon compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Votre compte et toutes vos données seront définitivement supprimés.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  @click="deleteAccount"
                  class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { z } from 'zod/v4'
import { toast } from 'vue-sonner'
import { Monitor, Moon, Sun, Trash2, Loader2, Github } from 'lucide-vue-next'
import { authClient, useSession } from '~/lib/auth-client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

definePageMeta({
  layout: 'sidebar-account',
})

const { data: sessionData } = await useSession(useFetch)
const session = computed(() => sessionData.value)

// Profile form
const profileValues = computed(() => ({
  name: session.value?.user?.name || '',
}))

const profileSchema = toTypedSchema(z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères.').max(50),
}))

const isUpdatingProfile = ref(false)
const onUpdateProfile = async (values) => {
  isUpdatingProfile.value = true
  try {
    await authClient.updateUser({
      name: values.name,
    })
    toast.success('Profil mis à jour avec succès.')
  } catch (error) {
    toast.error('Erreur lors de la mise à jour du profil.')
  } finally {
    isUpdatingProfile.value = false
  }
}

// Password form
const passwordSchema = toTypedSchema(z.object({
  currentPassword: z.string().min(1, 'Veuillez entrer votre mot de passe actuel.'),
  newPassword: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
  confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe.'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas.',
  path: ['confirmPassword'],
}))

const isChangingPassword = ref(false)
const onChangePassword = async (values) => {
  isChangingPassword.value = true
  try {
    await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    })
    toast.success('Mot de passe modifié avec succès.')
  } catch (error) {
    toast.error('Erreur lors du changement de mot de passe. Vérifiez votre mot de passe actuel.')
  } finally {
    isChangingPassword.value = false
  }
}

// Linked accounts
const linkedAccounts = ref({
  github: false,
  google: false,
  gitlab: false,
})

const providers = [
  { id: 'github', label: 'GitHub' },
  { id: 'google', label: 'Google' },
  { id: 'gitlab', label: 'GitLab' },
]

onMounted(async () => {
  for (const provider of ['github', 'google', 'gitlab']) {
    try {
      const res = await $fetch('/api/auth/linked-account', { query: { provider } })
      linkedAccounts.value[provider] = res.linked
    } catch {
      // ignore
    }
  }
})

// Theme
const { colorMode, setTheme } = useThemeTransition()
const themeOptions = [
  { value: 'system', icon: Monitor },
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
]

// Delete account
const deleteAccount = async () => {
  try {
    await authClient.deleteUser()
    await navigateTo('/', { replace: true, external: true })
  } catch (error) {
    toast.error('Erreur lors de la suppression du compte.')
  }
}
</script>
