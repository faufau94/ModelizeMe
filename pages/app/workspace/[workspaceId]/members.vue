<template>
  <div class="px-6 py-6 lg:px-8 max-w-5xl mx-auto w-full">
    <!-- Action bar -->
    <div class="flex items-center justify-between mb-5">
      <div class="relative w-full max-w-sm">
        <Input v-model="searchTerm" type="text" placeholder="Rechercher un membre..." class="bg-white dark:bg-card pl-10" />
        <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
          <SearchIcon class="size-4 text-muted-foreground" />
        </span>
      </div>
      <Button @click="showAddMemberDialog = true">
        <PlusIcon class="w-4 h-4 mr-2" />
        Ajouter
      </Button>
    </div>

    <!-- Members table -->
    <div class="rounded-xl border border-border bg-card">
      <div v-if="!isLoadingSelectedWorkspace">
        <Table>
          <TableHeader>
            <TableRow class="hover:bg-transparent">
              <TableHead class="h-12 px-4">Utilisateur</TableHead>
              <TableHead class="h-12 px-4">Rôle</TableHead>
              <TableHead v-if="getIsOwner" class="h-12 px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody v-if="filteredMembers?.length > 0">
            <TableRow v-for="member in filteredMembers" :key="member.user.id" class="hover:bg-muted/50">
              <TableCell class="py-4 px-4">
                <div class="flex items-center gap-4">
                  <Avatar class="h-9 w-9">
                    {{ member?.user?.name?.charAt(0).toUpperCase() }}
                  </Avatar>
                  <div class="space-y-0.5">
                    <p class="text-sm font-medium">{{ member?.user?.first_name }} {{ member?.user?.name }}</p>
                    <p class="text-xs text-muted-foreground">{{ member?.user?.email }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell class="py-4 px-4">
                <template v-if="getIsOwner">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button v-if="member?.role !== 'owner'" variant="outline" size="sm" class="h-7 px-2.5 text-xs gap-1">
                        {{ member?.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1).toLowerCase() : '' }}
                        <ChevronDownIcon class="h-3 w-3" />
                      </Button>
                      <Badge v-else variant="secondary" class="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                        Owner
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent v-if="member?.role !== 'owner'">
                      <DropdownMenuLabel class="text-xs">Changer le rôle</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        v-for="(role, index) in availableRoles"
                        :key="index"
                        @click="changeMemberRole(member.id, role)"
                        class="cursor-pointer text-sm"
                      >
                        {{ role }}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </template>
                <template v-else>
                  <Badge v-if="member?.role === 'owner'" variant="secondary" class="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    Owner
                  </Badge>
                  <Badge v-else variant="secondary">
                    {{ member?.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1).toLowerCase() : '' }}
                  </Badge>
                </template>
              </TableCell>
              <TableCell class="py-4 px-4 text-right">
                <Button
                  v-if="getIsOwner && member?.role !== 'owner'"
                  @click="confirmRemoveMember(member.id)"
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
          <TableBody v-else>
            <TableRow>
              <TableCell colspan="3" class="h-24 text-center text-muted-foreground">
                Aucun membre trouvé
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <!-- Add Member Dialog -->
    <Dialog :open="showAddMemberDialog" @update:open="showAddMemberDialog = $event">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un membre</DialogTitle>
          <DialogDescription>
            Invitez un nouveau membre à collaborer sur ce workspace.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="email">Adresse email</Label>
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
            Annuler
          </Button>
          <Button @click="addNewMember">
            Envoyer l'invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Confirm Remove Dialog -->
    <Dialog :open="!!memberToRemove" @update:open="memberToRemove = $event ? memberToRemove : null">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Retirer le membre</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir retirer ce membre ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="memberToRemove = null">
            Annuler
          </Button>
          <Button variant="destructive" @click="removeMember()">
            Retirer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">

// Replace useAuth with useSession from better-auth
import {useSession} from '~/lib/auth-client'
import {ref, computed} from 'vue'
import {useWorkspace} from '@/composables/api/useWorkspace'
import {useMember} from '@/composables/api/useMember'

// UI components and icons
import {ChevronDownIcon, PlusIcon, Search as SearchIcon, Trash2} from 'lucide-vue-next'
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
const searchTerm = ref('')
const showAddMemberDialog = ref(false)
const newMemberEmail = ref('')
const memberToRemove = ref<number|null>(null)

// Available roles
const availableRoles = ['Admin', 'Member']

const filteredMembers = computed(() => {
  const members = selectedWorkspace.value?.members || []
  if (!searchTerm.value) return members
  const search = searchTerm.value.toLowerCase()
  return members.filter(m =>
    m.user?.name?.toLowerCase().includes(search) ||
    m.user?.first_name?.toLowerCase().includes(search) ||
    m.user?.email?.toLowerCase().includes(search)
  )
})


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