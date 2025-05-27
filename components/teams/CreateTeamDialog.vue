<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="ghost" size="icon" class="gap-2 h-6 w-6">
        <PlusIcon class="h-4 w-4" />
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create New Team</DialogTitle>
        <DialogDescription>
          Create a new team and manage member assignments. Each user can only be in one team at a time.
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="onSubmit" class="space-y-6">
        <!-- Team Basic Info -->
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Team Name *</Label>
            <Input
              id="name"
              v-model="formData.name"
              placeholder="Enter team name"
              :class="{ 'border-red-500': errors.name }"
            />
            <p v-if="errors.name" class="text-sm text-red-500">{{ errors.name }}</p>
          </div>

          <div class="space-y-2">
            <Label for="description">Description</Label>
            <Textarea
              id="description"
              v-model="formData.description"
              placeholder="Brief description of the team's purpose"
              rows="3"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="color">Team Color</Label>
              <Select v-model="formData.color">
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">
                    <div class="flex items-center gap-2">
                      <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                      Blue
                    </div>
                  </SelectItem>
                  <SelectItem value="green">
                    <div class="flex items-center gap-2">
                      <div class="w-3 h-3 rounded-full bg-green-500"></div>
                      Green
                    </div>
                  </SelectItem>
                  <SelectItem value="purple">
                    <div class="flex items-center gap-2">
                      <div class="w-3 h-3 rounded-full bg-purple-500"></div>
                      Purple
                    </div>
                  </SelectItem>
                  <SelectItem value="orange">
                    <div class="flex items-center gap-2">
                      <div class="w-3 h-3 rounded-full bg-orange-500"></div>
                      Orange
                    </div>
                  </SelectItem>
                  <SelectItem value="red">
                    <div class="flex items-center gap-2">
                      <div class="w-3 h-3 rounded-full bg-red-500"></div>
                      Red
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label for="maxMembers">Max Members</Label>
              <Input
                id="maxMembers"
                v-model.number="formData.maxMembers"
                type="number"
                min="1"
                max="50"
                placeholder="10"
              />
            </div>
          </div>
        </div>

        <Separator />

        <!-- User Management Section -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">Team Members</h3>
            <div class="flex items-center space-x-2">
              <Checkbox
                id="autoDispatch"
                v-model:checked="formData.autoDispatch"
              />
              <Label for="autoDispatch" class="text-sm">Auto-dispatch unassigned users</Label>
            </div>
          </div>

          <div v-if="!formData.autoDispatch" class="space-y-4">
            <!-- Manual User Selection -->
            <div class="space-y-2">
              <Label>Select Members</Label>
              <div class="border rounded-lg p-3 max-h-48 overflow-y-auto">
                <div v-if="availableUsers.length === 0" class="text-sm text-gray-500 text-center py-4">
                  No unassigned users available
                </div>
                <div v-else class="space-y-2">
                  <div
                    v-for="user in availableUsers"
                    :key="user.id"
                    class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                  >
                    <Checkbox
                      :id="`user-${user.id}`"
                      :checked="formData.selectedUsers.includes(user.id)"
                      @update:checked="toggleUser(user.id)"
                    />
                    <Avatar class="h-8 w-8">
                      <AvatarImage :src="user.avatar" :alt="user.name" />
                      <AvatarFallback>{{ user.name.charAt(0).toUpperCase() }}</AvatarFallback>
                    </Avatar>
                    <div class="flex-1">
                      <p class="text-sm font-medium">{{ user.name }}</p>
                      <p class="text-xs text-gray-500">{{ user.email }}</p>
                    </div>
                    <Badge v-if="user.role" variant="secondary" class="text-xs">
                      {{ user.role }}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <!-- Selected Users Preview -->
            <div v-if="formData.selectedUsers.length > 0" class="space-y-2">
              <Label>Selected Members ({{ formData.selectedUsers.length }})</Label>
              <div class="flex flex-wrap gap-2">
                <Badge
                  v-for="userId in formData.selectedUsers"
                  :key="userId"
                  variant="outline"
                  class="gap-1"
                >
                  {{ getUserById(userId)?.name }}
                  <button
                    type="button"
                    @click="removeUser(userId)"
                    class="ml-1 hover:text-red-500"
                  >
                    <XIcon class="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            </div>
          </div>

          <div v-else class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <InfoIcon class="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 class="text-sm font-medium text-blue-900">Auto-dispatch Mode</h4>
                <p class="text-sm text-blue-700 mt-1">
                  All unassigned users ({{ availableUsers.length }}) will be automatically added to this team.
                  Users already in other teams will remain in their current teams.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Team Settings -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium">Team Settings</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center space-x-2">
              <Checkbox
                id="allowModelSharing"
                v-model:checked="formData.allowModelSharing"
              />
              <Label for="allowModelSharing" class="text-sm">Allow model sharing</Label>
            </div>
            
            <div class="flex items-center space-x-2">
              <Checkbox
                id="requireApproval"
                v-model:checked="formData.requireApproval"
              />
              <Label for="requireApproval" class="text-sm">Require approval for changes</Label>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <DialogFooter class="gap-2">
          <Button type="button" variant="outline" @click="isOpen = false">
            Cancel
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            <LoaderIcon v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
            Create Team
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PlusIcon,
  XIcon,
  InfoIcon,
  LoaderIcon
} from 'lucide-vue-next'

// Zod schema for form validation
const teamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(50, 'Team name must be less than 50 characters'),
  description: z.string().optional(),
  color: z.string().optional(),
  maxMembers: z.number().min(1).max(50).optional(),
  selectedUsers: z.array(z.string()),
  autoDispatch: z.boolean(),
  allowModelSharing: z.boolean(),
  requireApproval: z.boolean(),
})

// Mock data for workspace users
const workspaceUsers = ref([
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@company.com',
    avatar: '/placeholder.svg?height=32&width=32',
    role: 'Designer',
    teamId: null
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@company.com',
    avatar: '/placeholder.svg?height=32&width=32',
    role: 'Developer',
    teamId: 'team-1' // Already in a team
  },
  {
    id: '3',
    name: 'Carol Davis',
    email: 'carol@company.com',
    avatar: '/placeholder.svg?height=32&width=32',
    role: 'Analyst',
    teamId: null
  },
  {
    id: '4',
    name: 'David Wilson',
    email: 'david@company.com',
    avatar: '/placeholder.svg?height=32&width=32',
    role: 'Manager',
    teamId: null
  },
  {
    id: '5',
    name: 'Eva Brown',
    email: 'eva@company.com',
    avatar: '/placeholder.svg?height=32&width=32',
    role: 'Developer',
    teamId: null
  }
])

// Component state
const isOpen = ref(false)
const isSubmitting = ref(false)
const errors = ref({})

// Form data
const formData = reactive({
  name: '',
  description: '',
  color: 'blue',
  maxMembers: 10,
  selectedUsers: [],
  autoDispatch: false,
  allowModelSharing: true,
  requireApproval: false,
})

// Computed properties
const availableUsers = computed(() => {
  return workspaceUsers.value.filter(user => !user.teamId)
})

// Helper functions
const getUserById = (userId) => {
  return workspaceUsers.value.find(user => user.id === userId)
}

const toggleUser = (userId) => {
  const index = formData.selectedUsers.indexOf(userId)
  if (index > -1) {
    formData.selectedUsers.splice(index, 1)
  } else {
    formData.selectedUsers.push(userId)
  }
}

const removeUser = (userId) => {
  const index = formData.selectedUsers.indexOf(userId)
  if (index > -1) {
    formData.selectedUsers.splice(index, 1)
  }
}

const validateForm = () => {
  try {
    teamSchema.parse(formData)
    errors.value = {}
    return true
  } catch (error) {
    errors.value = {}
    error.errors.forEach(err => {
      errors.value[err.path[0]] = err.message
    })
    return false
  }
}

const onSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    const teamData = {
      ...formData,
      id: `team-${Date.now()}`,
      createdAt: new Date().toISOString(),
      members: formData.autoDispatch 
        ? availableUsers.value.map(user => user.id)
        : formData.selectedUsers
    }

    console.log('Creating team:', teamData)

    // Reset form and close dialog
    Object.assign(formData, {
      name: '',
      description: '',
      color: 'blue',
      maxMembers: 10,
      selectedUsers: [],
      autoDispatch: false,
      allowModelSharing: true,
      requireApproval: false,
    })
    
    isOpen.value = false
    
    // Show success message (you can replace with your notification system)
    alert(`Team "${teamData.name}" created successfully with ${teamData.members.length} members!`)
    
  } catch (error) {
    console.error('Error creating team:', error)
    alert('Failed to create team. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}
</script>