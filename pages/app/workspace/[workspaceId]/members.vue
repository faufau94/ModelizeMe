<template>
  <div class="min-h-screen bg-background p-4 md:p-8">
    <div class="mx-auto max-w-4xl bg-card rounded-xl shadow-sm">
      <!-- Header -->
      <div class="border-b p-6">
        <h1 class="text-2xl font-semibold text-foreground">Project Settings</h1>
      </div>

      <!-- Share Link Section -->
      <div class="border-b p-6">
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
      </div>

      <!-- Users List Section -->
      <div class="p-6">
        <h2 class="text-lg font-medium text-foreground mb-4">Team Members</h2>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(user, index) in users" :key="user.id">
              <TableCell>
                <div class="flex items-center">
                  <Avatar>
                    <AvatarImage :src="user.avatar" :alt="user.name" />
                    <AvatarFallback>{{ getInitials(user.name) }}</AvatarFallback>
                  </Avatar>
                  <div class="ml-4">
                    <div class="font-medium">{{ user.name }}</div>
                    <div class="text-sm text-muted-foreground">{{ user.email }}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <!-- Owner (first user) - no dropdown -->
                <Badge v-if="index === 0" variant="secondary" class="bg-amber-100 text-amber-800 hover:bg-amber-100">
                  Owner
                </Badge>
                
                <!-- Other users - dropdown -->
                <DropdownMenu v-else>
                  <DropdownMenuTrigger as-child>
                    <Button variant="outline" class="w-[110px] justify-between">
                      {{ user.role }}
                      <ChevronDownIcon class="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      v-for="role in availableRoles" 
                      :key="role"
                      @click="changeUserRole(user.id, role)"
                    >
                      {{ role }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              <TableCell class="text-right">
                <Button
                  v-if="index !== 0"
                  @click="confirmRemoveUser(user)"
                  variant="ghost"
                  class="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        
        <!-- Add Member Button -->
        <div class="mt-4">
          <Button @click="showAddMemberDialog = true">
            <PlusIcon class="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>
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
    <Dialog :open="!!userToRemove" @update:open="userToRemove = $event ? userToRemove : null">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Team Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {{ userToRemove?.name }} from the team?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="userToRemove = null">
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            @click="removeUser(userToRemove?.id)"
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>

definePageMeta({
  layout: 'sidebar',
});
import { ref } from 'vue';
import { CopyIcon, CheckIcon, RefreshCwIcon, ChevronDownIcon, PlusIcon } from 'lucide-vue-next';

// Import shadcn-vue components with correct paths
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogFooter, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useWorkspace } from '@/composables/api/useWorkspace';


const { workspaceShareLink } = useWorkspace();
// Share link state
const copied = ref(false);

// Users state
const users = ref([
  {
    id: 1,
    name: 'Alex Johnson',
    email: 'alex@example.com',
    role: 'Owner',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: 2,
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    role: 'Admin',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  {
    id: 3,
    name: 'Michael Brown',
    email: 'michael@example.com',
    role: 'Member',
    avatar: 'https://randomuser.me/api/portraits/men/46.jpg'
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily@example.com',
    role: 'Member',
    avatar: 'https://randomuser.me/api/portraits/women/67.jpg'
  }
]);

// Available roles
const availableRoles = ['Admin', 'Member'];

// Dialog states
const showAddMemberDialog = ref(false);
const newMemberEmail = ref('');
const userToRemove = ref(null);

// Copy share link to clipboard
const copyShareLink = () => {
  navigator.clipboard.writeText(workspaceShareLink.value);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};

// Generate a new share link
const regenerateShareLink = () => {
  // In a real app, you would call an API to generate a new link
//   const randomString = Math.random().toString(36).substring(2, 15);
//   shareLink.value = `https://app.example.com/invite/team/${randomString}`;
};

// Get user initials for avatar fallback
const getInitials = (name) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

// Change user role
const changeUserRole = (userId, newRole) => {
  const userIndex = users.value.findIndex(user => user.id === userId);
  if (userIndex !== -1) {
    users.value[userIndex].role = newRole;
  }
};

// Confirm user removal
const confirmRemoveUser = (user) => {
  userToRemove.value = user;
};

// Remove user
const removeUser = (userId) => {
  if (!userId) return;
  users.value = users.value.filter(user => user.id !== userId);
  userToRemove.value = null;
};

// Add new member
const addNewMember = () => {
  if (newMemberEmail.value) {
    // In a real app, you would send an invitation via API
    const newId = Math.max(...users.value.map(u => u.id)) + 1;
    users.value.push({
      id: newId,
      name: newMemberEmail.value.split('@')[0], // Simple name from email
      email: newMemberEmail.value,
      role: 'Member',
      avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 99)}.jpg`
    });
    newMemberEmail.value = '';
    showAddMemberDialog.value = false;
  }
};
</script>