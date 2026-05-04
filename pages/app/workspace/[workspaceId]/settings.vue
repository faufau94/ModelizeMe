<template>
  <div class="px-6 py-6 lg:px-8 max-w-5xl mx-auto w-full">
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- General Settings - owner/admin only -->
      <template v-if="getIsOwnerOrAdmin">
        <Form v-slot="{ handleSubmit }" :initial-values="initialValues" :validation-schema="formSchema" as="">
          <form @submit="handleSubmit($event, onSubmit)">
            <Card>
              <CardHeader>
                <CardTitle class="text-base">Informations générales</CardTitle>
                <CardDescription>
                  Modifiez le nom et la description de votre workspace.
                </CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <FormField v-slot="{ componentField }" name="name">
                  <FormItem>
                    <FormLabel for="workspace-name">Nom du workspace</FormLabel>
                    <FormControl>
                      <Input
                        id="workspace-name"
                        v-bind="componentField"
                        placeholder="Mon workspace"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="description">
                  <FormItem>
                    <FormLabel for="workspace-description">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        id="workspace-description"
                        v-bind="componentField"
                        placeholder="Décrivez votre workspace"
                        rows="3"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </CardContent>
              <CardFooter>
                <Button type="submit" size="sm" :disabled="isSaving">
                  <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
                  Enregistrer
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </template>

      <!-- Read-only info for members -->
      <Card v-if="!getIsOwnerOrAdmin">
        <CardHeader>
          <CardTitle class="text-base">Informations générales</CardTitle>
          <CardDescription>
            Vous n'avez pas les permissions nécessaires pour modifier les paramètres de ce workspace.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-2">
          <p class="text-sm"><span class="font-medium">Nom :</span> {{ selectedWorkspace?.name }}</p>
          <p class="text-sm"><span class="font-medium">Description :</span> {{ selectedWorkspace?.metadata ? JSON.parse(selectedWorkspace?.metadata)?.description || '-' : '-' }}</p>
        </CardContent>
      </Card>

      <!-- Danger Zone - owner only -->
      <Card v-if="getIsOwner" class="border-destructive/50">
        <CardHeader>
          <CardTitle class="text-base text-destructive">Zone de danger</CardTitle>
          <CardDescription>
            Supprimez définitivement ce workspace et toutes ses données. Cette action est irréversible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="destructive" size="sm">
                <Trash2 class="mr-2 h-4 w-4" />
                Supprimer le workspace
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Le workspace
                  « {{ selectedWorkspace.name }} » et toutes ses données seront définitivement supprimés.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                    @click="removeWorkspace"
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

definePageMeta({
  layout: 'sidebar',
})

import {reactive, ref} from 'vue'
import {AlertTriangle, Loader2, Settings, Shield, Trash2, Users} from 'lucide-vue-next'

// Shadcn-vue components
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
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
import {useWorkspace} from '~/composables/api/useWorkspace'
import {useForm} from 'vee-validate'
import {toTypedSchema} from '@vee-validate/zod'
import {z} from 'zod'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from '@/components/ui/form'
import {toast} from 'vue-sonner'

// Navigation sections
const sections = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'permissions', label: 'Permissions', icon: Shield },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
]

// Reactive data
const activeSection = ref('general')
const isSaving = ref(false)
const inviteEmail = ref('')
const inviteRole = ref('viewer')


const { selectedWorkspace, selectedWorkspaceId, updateWorkspace, deleteWorkspace, workspaces, goToThisWorkspaceUrl, getIsOwner, getIsOwnerOrAdmin } = useWorkspace()

// const workspace = ref({
//   name: selectedWorkspace.value?.name,
//   description: selectedWorkspace.value?.metadata?.description ? JSON.parse(selectedWorkspace.value?.metadata)?.description : '',
//   avatar: selectedWorkspace.value?.avatar
// })

const permissions = reactive({
  publicAccess: false,
  memberInvitations: true,
  modelCreation: true
})

const formSchema = toTypedSchema(z.object({
  name: z.string({
    required_error: "Workspace name is required",
  }).min(2, 'Workspace name must be at least 2 characters').max(50, 'Workspace name must be less than 50 characters'),
  description: z.string().optional(),
}))

const { initialValues } = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: selectedWorkspace.value?.name,
    description: selectedWorkspace.value?.metadata ? JSON.parse(selectedWorkspace.value?.metadata)?.description : '',
  },
})

// Methods
const onSubmit = async (values) => {
  isSaving.value = true
  try {
    await updateWorkspace(selectedWorkspace.value?.id, {
      name: values.name,
      description: values.description
    })
    toast.success('Workspace settings updated successfully')
  } catch (error) {
    console.error('Error saving workspace:', error)
    toast.error('Failed to update workspace settings')
  } finally {
    isSaving.value = false
  }
}

const savePermissions = () => {
  console.log('Permissions saved:', permissions)
}

const inviteMember = () => {
  if (inviteEmail.value && inviteRole.value) {
    console.log('Inviting member:', inviteEmail.value, 'as', inviteRole.value)
    inviteEmail.value = ''
    inviteRole.value = 'viewer'
  }
}

const removeWorkspace = async () => {
  const res = await deleteWorkspace(selectedWorkspace?.value?.id)
  console.log('res', res)

  if (res.error) {
    toast.error('Failed to delete workspace')
  } else {
    toast.success('Workspace deleted successfully')
    // redirect to the latest workspace by using the created at date
    const latestWorkspace = [...workspaces.value].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0]
    await navigateTo(goToThisWorkspaceUrl('', latestWorkspace.id))
  }
}
</script>

<style scoped>
/* Custom styles if needed */
</style>