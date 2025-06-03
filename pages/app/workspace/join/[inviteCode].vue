<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl font-bold">Rejoindre l'espace de travail</CardTitle>
        <CardDescription>Vous avez été invité à rejoindre cet espace de travail</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="text-center">
          <p class="text-sm text-gray-600">Collaborez avec les membres de votre équipe et gérez vos projets ensemble</p>
        </div>

        <div v-if="!session?.user" class="text-center">
          <p class="text-sm text-blue-600 bg-blue-50 p-4 rounded-md">
            Vous devez être connecté pour rejoindre cet espace de travail
          </p>
          <Button 
            @click="goToSignIn"
            class="w-full mt-4"
            size="lg"
          >
            Se connecter
          </Button>
        </div>

        <div v-else>
          <Button 
            @click="acceptInvitation"
            :disabled="isJoining"
            class="w-full"
            size="lg"
          >
            <Loader2 v-if="isJoining" class="mr-2 h-4 w-4 animate-spin" />
            {{ isJoining ? 'Connexion en cours...' : 'Rejoindre l\'espace de travail' }}
          </Button>

          <div v-if="message.type === 'error'" class="w-full mt-4">
            <div class="flex justify-start p-4 gap-x-2 rounded-md bg-red-50 border border-red-300">
              <AlertCircle class="h-6 w-6 text-red-500" />
              <p class="text-red-600">{{ message.text }}</p>
            </div>
          </div>
        </div>

        <p class="text-xs text-center text-gray-500">
          En rejoignant, vous acceptez les conditions d'utilisation de l'espace de travail
        </p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle, Loader2 } from 'lucide-vue-next'
import { ref } from 'vue'
import { useSession, authClient } from '~/lib/auth-client'

const isJoining = ref(false)
const route = useRoute()
const inviteCode = route.params.inviteCode as string

const message = ref({
  type: '',
  text: ''
})

// Vérifier si l'utilisateur est connecté
const { data: session } = await useSession(useFetch)

const goToSignIn = async () => {
  const currentPath = route.fullPath
  await navigateTo(`/sign-in?redirect=${encodeURIComponent(currentPath)}`)
}

const acceptInvitation = async () => {
  if (!session?.value?.user) return

  isJoining.value = true
  message.value = { type: '', text: '' }

  try {
    // On utilise directement le token d'invitation
    const res = await authClient.organization.acceptInvitation({
      invitationId: inviteCode
    })

    if (res.error) {
      if (res.error.message?.includes('not the recipient')) {
        message.value = {
          type: 'error',
          text: "Vous n'êtes pas le destinataire de cette invitation."
        }
      } else {
        message.value = {
          type: 'error',
          text: res.error.message || 'Invitation invalide ou expirée.'
        }
      }
      return
    }

    console.log('res', res)
    const orgId = res.data.invitation.organizationId
    if (orgId) {
      await navigateTo(`/app/workspace/${orgId}/dashboard`)
    } else {
      message.value = {
        type: 'error',
        text: "Impossible de récupérer l'organisation après acceptation."
      }
    }
  } catch (err: unknown) {
    message.value = {
      type: 'error',
      text: (err as Error)?.message || "Une erreur est survenue lors de l'acceptation de l'invitation."
    }
  } finally {
    isJoining.value = false
  }
}

</script>