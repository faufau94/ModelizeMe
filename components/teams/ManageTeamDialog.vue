<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-2xl max-h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Manage Team Members</DialogTitle>
        <DialogDescription>
          Add or remove members from your team
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-hidden flex flex-col gap-6">
        <!-- Current Team Members -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium">Current Team Members</h3>
          <ScrollArea class="h-[200px] rounded-md border p-4">
            <div class="space-y-3">
              <div
                  v-for="member in teamMembersLocal"
                  :key="member.id"
                  class="flex items-center justify-between gap-3"
              >
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar>
                    <AvatarImage :src="member.avatar" :alt="member.name"/>
                    <AvatarFallback>{{ getInitials(member.name) }}</AvatarFallback>
                  </Avatar>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ member.name }}</p>
                    <p class="text-xs text-muted-foreground truncate">
                      {{ member.email }}
                    </p>
                  </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    @click="removeMember(member.id)"
                >
                  <Trash color="red" class="h-4 w-4"/>
                </Button>
              </div>
              <div
                  v-if="teamMembersLocal.length === 0"
                  class="text-center py-8 text-sm text-muted-foreground"
              >
                No team members yet
              </div>
            </div>
          </ScrollArea>
        </div>

        <!-- Workspace Members -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium">Workspace Members</h3>
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <Input
                v-model="searchQuery"
                placeholder="Search members..."
                class="pl-9"
            />
          </div>
          <ScrollArea class="h-[200px] rounded-md border p-4">
            <div class="space-y-3">
              <div
                  v-for="member in filteredWorkspaceMembersLocal"
                  :key="member.id"
                  class="flex items-center justify-between gap-3"
              >
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar>
                    <AvatarImage :src="member.avatar" :alt="member.name"/>
                    <AvatarFallback>{{ getInitials(member.name) }}</AvatarFallback>
                  </Avatar>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ member.name }}</p>
                    <p class="text-xs text-muted-foreground truncate">
                      {{ member.email }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <Badge v-if="isInTeam(member.id)" variant="secondary">
                    In Team
                  </Badge>
                  <Button
                      size="sm"
                      :disabled="isInTeam(member.id)"
                      @click="addMember(member)"
                  >
                    <Plus class="h-4 w-4 mr-1"/>
                    Add
                  </Button>
                </div>
              </div>
              <div
                  v-if="filteredWorkspaceMembersLocal.length === 0"
                  class="text-center py-8 text-sm text-muted-foreground"
              >
                No members found
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeDialog">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {ref, computed, watch} from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Badge} from '@/components/ui/badge'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Plus, Trash, Search} from 'lucide-vue-next'
import {toast} from 'vue-sonner'

import {useWorkspace} from "~/composables/api/useWorkspace";
import {useTeam} from "~/composables/api/useTeam";


const props = defineProps<{
  teamId: string | null
  open?: boolean
}>()

const emit = defineEmits(['update:open'])

const isOpen = computed({
  get: () => Boolean(props.open),
  set: (v: boolean) => emit('update:open', v),
})

const searchQuery = ref('')

const {selectedWorkspace} = useWorkspace()
const {addTeamMember, removeTeamMember} = useTeam()

const workspaceMembersLocal = computed(() => {
  if (!selectedWorkspace.value?.members) return []

  return selectedWorkspace.value.members.map((member: any) => ({
    id: member.user?.id,
    name: member.user?.name || '',
    email: member.user?.email || '',
    avatar: member.user?.image || undefined
  }))
})

// Transformation des membres de l'équipe
const teamMembersLocal = computed(() => {
  if (!selectedWorkspace.value?.teams && selectedWorkspace.value?.teams.length < 0) return []

  // Get the team from the workspace teams
  const teamInWorkspace = selectedWorkspace.value.teams.find((t: any) => t.id === props.teamId)
  console.log('teamInWorkspace computed for teamId:', teamInWorkspace)
  if (teamInWorkspace) {
    return teamInWorkspace.members.map((tm: any) => ({
      id: tm.user?.id,
      name: tm.user?.name || '',
      email: tm.user?.email || '',
      avatar: tm.user?.image || undefined
    }))
  }
})

const filteredWorkspaceMembersLocal = computed(() => {
  if (!searchQuery.value) return workspaceMembersLocal.value

  const query = searchQuery.value.toLowerCase()
  return workspaceMembersLocal.value.filter(
      (member) =>
          member.name?.toLowerCase().includes(query) ||
          member.email?.toLowerCase().includes(query)
  )
})

const getInitials = (name: string) => {
  if (!name) return '?'
  return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
}

const isInTeam = (memberId: string) => {
  return teamMembersLocal.value.some((member) => member.id === memberId)
}

const addMember = async (member) => {
  if (!isInTeam(member.id)) {
    try {
      await addTeamMember(props.teamId, member.id)
      toast.success(`${member.name} a été ajouté à l'équipe`)
    } catch (error) {
      console.error('Error adding member to team:', error)
      toast.error('Erreur lors de l\'ajout du membre')
    }
  }
}


const removeMember = async (memberId: string) => {
  if (!props.teamId) return;
  console.log(props.teamId)
  console.log('removeMember ', memberId)
  try {
    // Appel API pour supprimer le membre de l'équipe
    await removeTeamMember(props.teamId, memberId);
    toast.success('Membre supprimé de l\'équipe');
  } catch (error) {
    console.error('Error removing member from team:', error);
    toast.error('Erreur lors de la suppression du membre');
  }
}

const closeDialog = () => {
  isOpen.value = false
}
</script>