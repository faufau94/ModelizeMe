<template>
  <div class="min-h-screen bg-background p-4 md:p-8">

    <div class="mx-auto max-w-4xl bg-card rounded-xl shadow-sm">

      <!-- Header -->
      <div class="flex justify-between items-center p-6">
        <div>
          <h1 class="text-2xl font-semibold text-foreground">Members of {{ selectedWorkspace?.name }}</h1>
        </div>
        <!-- Add Member Button -->
        <div class="mt-4">
          <Button @click="showAddMemberDialog = true">
            <PlusIcon class="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      
      <!-- Share Link Section -->
      <!-- <div v-if="getIsOwner" class="border-b p-6">
        <h2 class="text-lg font-medium text-foreground mb-4">Share Link</h2>
        <div class="flex flex-col sm:flex-row gap-3">
          <Input
            type="text"
            readonly
            :model-value="workspaceShareLink"
            class="flex-grow"
          />
          <Button @click="copyShareLink" variant="default">
            <CopyIcon v-if="!copied" class="w-4 h-4 mr-2" />
            <CheckIcon v-else class="w-4 h-4 mr-2" />
            {{ copied ? 'Copied!' : 'Copy Link' }}
          </Button>
          <Button @click="regenerateShareLink" variant="outline">
            <RefreshCwIcon class="w-4 h-4 mr-2" />
            Regenerate
          </Button>
        </div>
      </div> -->

      <!-- Members List Section -->
      <div v-if="!isLoadingMembers" class="px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead v-if="getIsOwner" class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody v-if="members?.length > 0">
            <TableRow v-for="(member, index) in members" :key="member.user.id">
              <TableCell>
                <div class="flex items-center">
                  <Avatar>
                    {{ member?.user?.name?.charAt(0).toUpperCase() }}
                  </Avatar>
                  <div class="ml-4">
                    <div class="font-medium">{{ member?.user?.first_name }} {{ member?.user?.name }}</div>
                    <div class="text-sm text-muted-foreground">{{ member?.user?.email }}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <template v-if="getIsOwner && member?.role?.name !== 'OWNER' && !isLoadingWorkspaceRoles">
                  <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="outline" class="w-[110px] justify-between">
                        {{ member?.role?.name ? member.role.name.charAt(0).toUpperCase() + member.role.name.slice(1).toLowerCase() : '' }}
                      <ChevronDownIcon class="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      v-for="role in workspaceRoles.filter(r => r.name !== 'OWNER')" 
                      :key="role.id"
                      @click="changeMemberRole(member.id, role.id)"
                    >
                      {{ role?.name ? role.name.charAt(0).toUpperCase() + role.name.slice(1).toLowerCase() : '' }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </template>

                <template v-else>
                  <template v-if="member?.role?.name === 'OWNER'">
                    <Badge variant="secondary" class="bg-amber-100 text-amber-800 hover:bg-amber-100">
                      Owner
                    </Badge>
                  </template>
                  <template v-else>
                    <Badge variant="secondary" class="bg-gray-100 text-gray-800">
                      {{ member?.role?.name }}
                    </Badge>
                  </template>
                </template>
                
              </TableCell>
              <TableCell class="text-right">
                <Button
                  v-if="getIsOwner && member?.role?.name !== 'OWNER'"
                  @click="confirmRemoveMember(member.userId)"
                  variant="ghost"
                  class="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Remove
                </Button>

              </TableCell>
            </TableRow>
          </TableBody>

          <TableBody v-else>
            <TableRow>
              <TableCell colspan="3" class="text-center">
                No members found
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        
        
      </div>
    </div>
    
    <!-- Add Member Dialog -->
    <Dialog :open="showAddMemberDialog" @update:open="showAddMemberDialog = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Invite a new team member to collaborate on this project.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="email">Email Address</Label>
            <Input
              id="email"
              v-model="newMemberEmail"
              type="email"
              placeholder="email@example.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showAddMemberDialog = false">
            Cancel
          </Button>
          <Button @click="addNewMember">
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Confirm Remove Dialog -->
    <Dialog :open="!!memberToRemove" @update:open="memberToRemove = $event ? memberToRemove : null">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Team Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this member?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="memberToRemove = null">
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            @click="removeMember(memberToRemove)"
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">

// Replace useAuth with useSession from better-auth
import { useSession } from '~/lib/auth-client'

definePageMeta({
  layout: 'sidebar',
})
import { ref } from 'vue'
import { useWorkspace } from '@/composables/api/useWorkspace'
import { useMember } from '@/composables/api/useMember'

// UI components and icons
import { CopyIcon, CheckIcon, RefreshCwIcon, ChevronDownIcon, PlusIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { 
  Dialog, DialogContent, DialogHeader,
  DialogFooter, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'vue-sonner'
import { authClient } from '~/lib/auth-client'

// Use better-auth's useSession
const { data: session } = await useSession(useFetch)

// Get active member
// const activeMember = await authClient.organization.getActiveMember()

// Extract workspace share link
const { workspaceShareLink, selectedWorkspace, workspaceRoles, isLoadingWorkspaceRoles, getIsOwner, regenerateWorkspaceInviteCode } = useWorkspace()

// Use Member composable
const { members, isLoadingMembers, addMember, updateMember, deleteMember } = useMember()

// Local state
const copied = ref(false)
const showAddMemberDialog = ref(false)
const newMemberEmail = ref('')
const memberToRemove = ref<number|null>(null)

// Available roles
const availableRoles = ['Owner', 'Member']

// Copy share link to clipboard
const copyShareLink = () => {
  navigator.clipboard.writeText(workspaceShareLink.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

// Regenerate share link (API call placeholder)
const regenerateShareLink = async () => {
  await regenerateWorkspaceInviteCode()
  copied.value = false  
}


// Change member role
const changeMemberRole = async (memberId: number, newRoleId: number) => {
  const res = await updateMember(memberId.toString(), { roleId: newRoleId })
  if (res.status === 200 && res.body?.role) {
    toast.success(`Member's role has been changed to ${res.body.role.name}.`)
  } else {
    toast.error(res.body?.message || 'Error updating member role')
  }
}

// Add new member (invite via API)
const addNewMember = async () => {
  if (!newMemberEmail.value) return
  await addMember({ email: newMemberEmail.value })
  showAddMemberDialog.value = false
  newMemberEmail.value = ''
}

// Confirm remove member
const confirmRemoveMember = (id: number) => {
  memberToRemove.value = id
}

// Remove member
const removeMember = async (id: number|null) => {
  if (id) {
    const res = await deleteMember(id.toString())
    memberToRemove.value = null
    toast.success(res.body?.message || 'Member removed')
  }
}


</script>