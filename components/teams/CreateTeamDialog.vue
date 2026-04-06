<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <div class="cursor-pointer hover:bg-accent p-2 rounded-md flex items-center gap-2 text-sm font-medium text-muted-foreground border border-dashed border-border">
        <PlusIcon class="h-4 w-4" />
      </div>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create New Team</DialogTitle>
        <DialogDescription>
          Create a new team and manage member assignments. Users can be in multiple teams.
        </DialogDescription>
      </DialogHeader>
      
      <form @submit="onSubmit" class="space-y-6">
        <!-- Team Basic Info -->
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Team Name *</Label>
            <Input
              id="name"
              v-model="name"
              placeholder="Enter team name"
              :class="{ 'border-red-500': errors.name }"
            />
            <p v-if="errors.name" class="text-sm text-red-500">{{ errors.name }}</p>
          </div>

          <div class="space-y-2">
            <Label for="description">Description</Label>
            <Textarea
              id="description"
              v-model="description"
              placeholder="Brief description of the team's purpose"
              rows="3"
            />
            <p v-if="errors.description" class="text-sm text-red-500">{{ errors.description }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="color">Team Color</Label>
              <Select v-model="color">
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="color in colors" :value="color" :key="color">
                    <div class="flex items-center gap-2">
                      <div class="w-3 h-3 rounded-full" :class="teamColorClass(color)"></div>
                      {{ color.charAt(0).toUpperCase() + color.slice(1) }}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p v-if="errors.color" class="text-sm text-red-500">{{ errors.color }}</p>
            </div>
            <div class="space-y-2">
              <Label for="maxMembers">Max Members</Label>
              <Input
                id="maxMembers"
                v-model.number="maxMembers"
                type="number"
                min="1"
                max="50"
                placeholder="10"
              />
              <p v-if="errors.maxMembers" class="text-sm text-red-500">{{ errors.maxMembers }}</p>
            </div>
          </div>
        </div>

        <Separator />

        <!-- User Management Section -->
        <div class="space-y-4">
          <div class="space-y-3">
            <h3 class="text-lg font-medium">Team Members</h3>
            <div class="space-y-3">
              <div class="flex items-center space-x-2">
                <input
                  id="manual"
                  type="radio"
                  value="manual"
                  v-model="dispatchMode"
                  class="h-4 w-4 text-blue-600"
                />
                <Label for="manual" class="text-sm">Manual selection</Label>
              </div>
              <div class="flex items-center space-x-2">
                <input
                  id="unassigned"
                  type="radio"
                  value="unassigned"
                  v-model="dispatchMode"
                  class="h-4 w-4 text-blue-600"
                />
                <Label for="unassigned" class="text-sm">Auto-dispatch unassigned users only</Label>
              </div>
              <div class="flex items-center space-x-2">
                <input
                  id="all"
                  type="radio"
                  value="all"
                  v-model="dispatchMode"
                  class="h-4 w-4 text-blue-600"
                />
                <Label for="all" class="text-sm">Auto-dispatch all workspace users</Label>
              </div>
            </div>
            <p v-if="errors.dispatchMode" class="text-sm text-red-500">{{ errors.dispatchMode }}</p>
          </div>

          
          <div v-if="dispatchMode === 'manual'" class="space-y-4">
            <!-- Manual User Selection -->
            <div class="space-y-2">
              <Label>Select Members</Label>
              <div class="border rounded-lg p-3 max-h-48 overflow-y-auto">
                <div v-if="getMembersList.length === 0" class="text-sm text-gray-500 text-center py-4">
                  No users available
                </div>
                <div v-else class="space-y-2">
                  <div
                    v-for="member in getMembersList"
                    :key="member.id"
                    class="flex items-center space-x-3 p-2 hover:bg-accent/50 rounded"
                  >
                    <Checkbox
                      :id="`member-${member.id}`"
                      :checked="selectedUsers.includes(member.id)"
                      @update:checked="toggleUser(member.id)"
                    />
                    <Avatar class="h-8 w-8">
                      {{ member?.first_name?.charAt(0).toUpperCase() }}
                    </Avatar>
                    <div class="flex-1">
                      <p class="text-sm font-medium">{{ member.first_name }} {{ member.name }}</p>
                      <p class="text-xs text-gray-500">{{ member.email }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <Badge v-if="member?.teamName" variant="outline" class="text-xs text-orange-600 border-orange-200">
                        {{ member?.teamName }}
                      </Badge>
                      <Badge v-else variant="outline" class="text-xs text-green-600 border-green-200">
                        Unassigned
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <p v-if="errors.selectedUsers" class="text-sm text-red-500">{{ errors.selectedUsers }}</p>
            </div>

            <!-- Selected Users Preview -->
            <div v-if="selectedUsers.length > 0" class="space-y-2">
              <Label>Selected Members ({{ selectedUsers.length }})</Label>
              <div class="flex flex-wrap gap-2">
                <Badge
                  v-for="userId in selectedUsers"
                  :key="userId"
                  variant="outline"
                  class="gap-1"
                >
                  {{ getUserById(userId)?.user?.name }}
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

          <div v-else-if="dispatchMode === 'unassigned'" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <InfoIcon class="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 class="text-sm font-medium text-blue-900">Auto-dispatch Unassigned Users</h4>
                <p class="text-sm text-blue-700 mt-1">
                  All unassigned users ({{ availableUsers.length }}) will be automatically added to this team.
                  Users already in other teams will remain in their current teams only.
                </p>
              </div>
            </div>
          </div>

          <div v-else-if="dispatchMode === 'all'" class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <InfoIcon class="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 class="text-sm font-medium text-green-900">Auto-dispatch All Users</h4>
                <p class="text-sm text-green-700 mt-1">
                  All workspace users will be added to this team.
                  Users can be members of multiple teams simultaneously.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Form Actions -->
        <DialogFooter class="gap-2">
          <Button type="button" variant="outline" @click="resetFormAndClose">
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
import {computed, ref} from 'vue'
import {useForm} from 'vee-validate'
import {toTypedSchema} from '@vee-validate/zod'
import {z} from 'zod'
import {teamColorClass} from "~/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Checkbox} from '@/components/ui/checkbox'
import {Badge} from '@/components/ui/badge'
import {Avatar} from '@/components/ui/avatar'
import {Separator} from '@/components/ui/separator'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select'
import {InfoIcon, LoaderIcon, PlusIcon, XIcon} from 'lucide-vue-next'
import {toast} from 'vue-sonner'

import {useTeam} from '@/composables/api/useTeam';
import {useWorkspace} from '~/composables/api/useWorkspace'

const { selectedWorkspace } = useWorkspace()


// Zod schema for form validation
const teamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(50, 'Team name must be less than 50 characters'),
  description: z.string().optional(),
  color: z.string().default('blue'),
  maxMembers: z.number().min(1, 'Must have at least 1 member').max(50, 'Cannot exceed 50 members').default(10),
  selectedUsers: z.array(z.number()).default([]),
  dispatchMode: z.enum(['manual', 'unassigned', 'all']).default('manual'),
})

const getMembersList = computed(() => {

  const memberListWithoutOwners = selectedWorkspace?.value?.members?.filter(member => member.role !== 'owner')
  return memberListWithoutOwners.map(member => {
    const teamMemberships = member.user.teamMemberships || []
    let teamName = null
    if (teamMemberships.length === 1) {
      teamName = teamMemberships[0].team?.name
    } else if (teamMemberships.length > 1) {
      teamName = `+${teamMemberships.length} teams`
    }
    return {
      id: member.user.id,
      name: member.user.name,
      first_name: member.user.first_name,
      email: member.user.email,
      teamName
    }
  })
})


// Component state
const isOpen = ref(false)
const isSubmitting = ref(false)

const { createTeam } = useTeam()

// vee-validate form setup
const { defineField, handleSubmit, errors, resetForm, values } = useForm({
  validationSchema: toTypedSchema(teamSchema),
  initialValues: {
    name: '',
    description: '',
    color: 'blue',
    maxMembers: 10,
    selectedUsers: [],
    dispatchMode: 'manual'
  }
})

// Define form fields
const [name] = defineField('name')
const [description] = defineField('description')
const [color] = defineField('color')
const [maxMembers] = defineField('maxMembers')
const [selectedUsers] = defineField('selectedUsers')
const [dispatchMode] = defineField('dispatchMode')

// Computed properties
const availableUsers = computed(() => {
  return selectedWorkspace.value?.members?.filter(member => !member.user.teamId)
})

// Helper functions
const getUserById = (userId) => {
  return selectedWorkspace.value?.members?.find(member => member.user.id === userId) || null
}

const toggleUser = (userId) => {
  const currentUsers = selectedUsers.value || []
  if (currentUsers.includes(userId)) {
    selectedUsers.value = currentUsers.filter(id => id !== userId)
  } else {
    selectedUsers.value = [...currentUsers, userId]
  }

}

const removeUser = (userId) => {
  const currentUsers = selectedUsers.value || []
  selectedUsers.value = currentUsers.filter(id => id !== userId)
}

const resetFormAndClose = () => {
  resetForm()
  isOpen.value = false
}

// Form submission with vee-validate
const onSubmit = handleSubmit(async (formValues) => {
  isSubmitting.value = true

  try {
    await createTeam(formValues)

    // let members = []
    // if (formValues.dispatchMode === 'manual') {
    //   members = formValues.selectedUsers
    // } else if (formValues.dispatchMode === 'unassigned') {
    //   members = availableUsers.value.map(user => user.id)
    // } else if (formValues.dispatchMode === 'all') {
    //   members = workspaceUsers.value.map(user => user.id)
    // }

    // const teamData = {
    //   ...formValues,
    //   id: `team-${Date.now()}`,
    //   createdAt: new Date().toISOString(),
    //   members
    // }

    // console.log('Creating team:', teamData)

    // Reset form and close dialog
    resetForm()
    isOpen.value = false
    
    toast.success(`Team created successfully!`)
    
  } catch (error) {
    console.error('Error creating team:', error)
    toast.error('Failed to create team. Please try again.')
  } finally {
    isSubmitting.value = false
  }
})

const colors = ['blue', 'green', 'purple', 'orange', 'red']
</script>
