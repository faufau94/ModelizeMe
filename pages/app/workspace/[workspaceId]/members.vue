<template>
  <div class="min-h-screen bg-background p-4 md:p-8">

    <div class="mx-auto max-w-4xl px-8 pb-8 border-b bg-card rounded-xl shadow-sm">

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
      <div v-if="!isLoadingSelectedWorkspace" class="px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead v-if="getIsOwner" class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody v-if="selectedWorkspace?.members?.length > 0">
            <TableRow v-for="(member, index) in selectedWorkspace?.members" :key="member.user.id">
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

                <template v-if="getIsOwner">
                  <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button v-if="member?.role !== 'owner'" variant="outline" class="w-[110px] justify-between">
                        {{ member?.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1).toLowerCase() : '' }}
                      <ChevronDownIcon class="ml-2 h-4 w-4" />
                    </Button>
                    <div v-else>
                      <Badge variant="secondary" class="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        Owner
                      </Badge>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent v-if="member?.role !== 'owner'">
                    <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      v-for="(role, index) in availableRoles"
                      :key="index"
                      @click="changeMemberRole(member.id, role)"
                    >
                      {{ role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : '' }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </template>

                <template v-else>
                  <template v-if="member?.role === 'owner'">
                    <Badge variant="secondary" class="bg-amber-100 text-amber-800 hover:bg-amber-100">
                      Owner
                    </Badge>
                  </template>
                  <template v-else>
                    <Badge variant="secondary" class="bg-gray-100 text-gray-800">
                      {{ member?.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1).toLowerCase() : '' }}
                    </Badge>
                  </template>
                </template>

              </TableCell>
              <TableCell class="text-right">
                <Button
                  v-if="getIsOwner && member?.role !== 'owner'"
                  @click="confirmRemoveMember(member.id)"
                  variant="ghost"
                  size="icon"
                  class="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <TrashIcon class="w-4 h-4" />
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
            @click="removeMember()"
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
import {useSession} from '~/lib/auth-client'
import {ref} from 'vue'
import {useWorkspace} from '@/composables/api/useWorkspace'
import {useMember} from '@/composables/api/useMember'

// UI components and icons
import {ChevronDownIcon, PlusIcon, TrashIcon} from 'lucide-vue-next'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Avatar} from '@/components/ui/avatar'
import {Badge} from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Label} from '@/components/ui/label'
import {toast} from 'vue-sonner'

definePageMeta({
  layout: 'sidebar',
})

// Use better-auth's useSession
const { data: session } = await useSession(useFetch)

// Get active member
// const activeMember = await authClient.organization.getActiveMember()

// Extract workspace share link
const { selectedWorkspace, getIsOwner, isLoadingSelectedWorkspace } = useWorkspace()

// Use Member composable
const { addMember, updateMember, deleteMember } = useMember()

// Local state
const copied = ref(false)
const showAddMemberDialog = ref(false)
const newMemberEmail = ref('')
const memberToRemove = ref<number|null>(null)

// Available roles
const availableRoles = ['Admin', 'Member']


// Change member role
const changeMemberRole = async (memberId: number, newRole: string) => {
  const res = await updateMember(memberId.toString(), { role: newRole.toLowerCase() })
  if (res.error) {
    toast.error(res.data?.message || 'Error updating member role')
  } else {
    toast.success(`Member's role has been changed to ${res.data.role}.`)
  }
}

// Add new member (using better-auth)
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
const removeMember = async () => {
  if (memberToRemove.value) {
    console.log('memberToRemove', memberToRemove.value)
    const res = await deleteMember(memberToRemove.value.toString())
    console.log('res', res)
    memberToRemove.value = null
    if (res.error) {
      toast.error(res.data?.message || 'Error removing member')
    } else {
      toast.success(res.data?.message || 'Member removed')
    }
  }
}

</script>