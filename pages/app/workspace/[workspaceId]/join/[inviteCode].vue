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

        <Button 
          @click="joinNewWorkspace"
          :disabled="isJoining"
          class="w-full"
          size="lg"
        >
          <Loader2 v-if="isJoining" class="mr-2 h-4 w-4 animate-spin" />
          {{ isJoining ? 'Connexion en cours...' : 'Rejoindre l\'espace de travail' }}
        </Button>

        <div v-if="message.type === 'error'" class="w-full">
                <div class="flex justify-start p-4 gap-x-2 rounded-md bg-red-50 border border-red-300">
                  <AlertCircle class="h-6 w-6 text-red-500" />
                  <p class="text-red-600">{{ message.text }}</p>
                </div>
              </div>

        <p class="text-xs text-center text-gray-500">
          En rejoignant, vous acceptez les conditions d'utilisation de l'espace de travail
        </p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { Loader2 } from 'lucide-vue-next'
import { ref } from 'vue'
import { useWorkspace } from '~/composables/api/useWorkspace'

const isJoining = ref(false)

const route = useRoute()

const workspaceId = route.params.workspaceId
const inviteCode = route.params.inviteCode

console.log('Workspace ID:', workspaceId)
console.log('Invite Code:', inviteCode)

const { joinWorkspace } = useWorkspace()

const message = ref({
    type: '',
    message: ''
})

const joinNewWorkspace = async () => {
  isJoining.value = true
  
  try {
    const res = await joinWorkspace(workspaceId, inviteCode)

    if (res.status !== 200) {
      message.value = {
        type: 'error',
        text: res.body.message
      }
    }
    
    
  } catch (error) {
    message.value = {
        type: 'error',
        text: 'Échec de la connexion à l\'espace de travail'
      }
  } finally {
    isJoining.value = false
  }
}
</script>