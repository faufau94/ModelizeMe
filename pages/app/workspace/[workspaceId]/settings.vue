<template>
  <div class="min-h-screen bg-background">

    <div class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-3 space-y-6">
          <!-- General Settings -->
          <div class="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>
                  Update your workspace name and description.
                </CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="space-y-2">
                  <Label for="workspace-name">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    v-model="workspace.name"
                    placeholder="Enter workspace name"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="workspace-description">Description</Label>
                  <Textarea
                    id="workspace-description"
                    v-model="workspace.description"
                    placeholder="Describe your workspace"
                    rows="3"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button @click="saveGeneral" :disabled="isSaving">
                  <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>

            <!-- <Card>
              <CardHeader>
                <CardTitle>Workspace Avatar</CardTitle>
                <CardDescription>
                  Upload an image to represent your workspace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div class="flex items-center gap-4">
                  <Avatar class="h-16 w-16">
                    <AvatarImage :src="workspace.avatar" />
                    <AvatarFallback>{{ workspace.name.charAt(0).toUpperCase() }}</AvatarFallback>
                  </Avatar>
                  <div class="space-y-2">
                    <Button variant="outline" size="sm">
                      <Upload class="mr-2 h-4 w-4" />
                      Upload Image
                    </Button>
                    <p class="text-xs text-muted-foreground">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card> -->
          </div>

          <!-- Permissions Section -->
          <div class="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Access Control</CardTitle>
                <CardDescription>
                  Configure who can access and modify this workspace.
                </CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <Label>Public Access</Label>
                      <p class="text-sm text-muted-foreground">
                        Allow anyone with the link to view this workspace
                      </p>
                    </div>
                    <Switch v-model="permissions.publicAccess" />
                  </div>
                  
                  <div class="flex items-center justify-between">
                    <div>
                      <Label>Member Invitations</Label>
                      <p class="text-sm text-muted-foreground">
                        Allow members to invite others to this workspace
                      </p>
                    </div>
                    <Switch v-model="permissions.memberInvitations" />
                  </div>
                  
                  <div class="flex items-center justify-between">
                    <div>
                      <Label>Model Creation</Label>
                      <p class="text-sm text-muted-foreground">
                        Allow all members to create new models
                      </p>
                    </div>
                    <Switch v-model="permissions.modelCreation" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button @click="savePermissions">Save Permissions</Button>
              </CardFooter>
            </Card>
          </div>

          <!-- Danger Zone -->
          <div class="space-y-6">
            <Card class="border-destructive">
              <CardHeader>
                <CardTitle class="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions.
                </CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="space-y-4">
                  <!-- <div class="p-4 border border-destructive/20 rounded-lg">
                    <h4 class="font-medium mb-2">Transfer Workspace</h4>
                    <p class="text-sm text-muted-foreground mb-3">
                      Transfer this workspace to another user. You will lose admin access.
                    </p>
                    <Button variant="outline" size="sm">
                      Transfer Workspace
                    </Button>
                  </div> -->
                  
                  <div class="p-4 border border-destructive/20 rounded-lg">
                    <h4 class="font-medium mb-2 text-destructive">Delete Workspace</h4>
                    <p class="text-sm text-muted-foreground mb-3">
                      Permanently delete this workspace and all its data. This action cannot be undone.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger as-child>
                        <Button variant="destructive" size="sm">
                          <Trash2 class="mr-2 h-4 w-4" />
                          Delete Workspace
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            "{{ workspace.name }}" workspace and remove all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            @click="deleteWorkspace"
                            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Workspace
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

definePageMeta({
  layout: 'sidebar',
})

import { ref, reactive } from 'vue'
import {
  ChevronRight,
  Settings,
  Users,
  Shield,
  AlertTriangle,
  Upload,
  UserPlus,
  MoreHorizontal,
  Loader2,
  Trash2
} from 'lucide-vue-next'

// Shadcn-vue components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

const workspace = reactive({
  name: 'My Database Project',
  description: 'A comprehensive database modeling workspace for our team',
  avatar: ''
})

const permissions = reactive({
  publicAccess: false,
  memberInvitations: true,
  modelCreation: true
})

const members = ref([
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    avatar: ''
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'editor',
    avatar: ''
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'viewer',
    avatar: ''
  }
])

// Methods
const saveGeneral = async () => {
  isSaving.value = true
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  isSaving.value = false
  console.log('General settings saved:', workspace)
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

const deleteWorkspace = () => {
  console.log('Deleting workspace:', workspace.name)
  // Handle workspace deletion
}
</script>

<style scoped>
/* Custom styles if needed */
</style>