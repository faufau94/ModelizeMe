<template>
  <div>
    <Card class="w-full border-none">
      <CardHeader>
        <div class="flex justify-between items-center">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription class="mt-3">Manage your team members here.</CardDescription>
          </div>
          <Button @click="isDialogOpen = true">
            <CirclePlus :size="20" class="mr-2"/>
            Ajouter un membre
          </Button>
        </div>
      </CardHeader>
      <CardContent class="border-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(member, index) in members" :key="index">
              <TableCell class="font-medium">{{ member.name }}</TableCell>
              <TableCell>{{ member.role }}</TableCell>
              <TableCell>{{ member.email }}</TableCell>
              <TableCell>{{ member.phone }}</TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <Button variant="ghost" size="icon" @click="isEditDialogOpen = true">
                    <FilePenIcon class="w-4 h-4"/>
                    <span class="sr-only">Edit</span>
                  </Button>
                  <Button variant="ghost" size="icon" @click="isDeleteDialogOpen = true">
                    <Trash2 class="w-4 h-4"/>
                    <span class="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Add Member Dialog -->
    <Dialog :open="isDialogOpen" @open-change="isDialogOpen = $event">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>Enter the details of the new team member.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid items-center grid-cols-4 gap-4">
            <Label for="name" class="text-right">Name</Label>
            <Input id="name" placeholder="John Doe" class="col-span-3"/>
          </div>
          <div class="grid items-center grid-cols-4 gap-4">
            <Label for="role" class="text-right">Role</Label>
            <Input id="role" placeholder="Project Manager" class="col-span-3"/>
          </div>
          <div class="grid items-center grid-cols-4 gap-4">
            <Label for="email" class="text-right">Email</Label>
            <Input id="email" type="email" placeholder="john.doe@example.com" class="col-span-3"/>
          </div>
          <div class="grid items-center grid-cols-4 gap-4">
            <Label for="phone" class="text-right">Phone</Label>
            <Input id="phone" placeholder="+1 (555) 123-4567" class="col-span-3"/>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" @click="isDialogOpen = false">Add Member</Button>
          <Button variant="outline" @click="isDialogOpen = false">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Member Dialog -->
    <Dialog :open="isEditDialogOpen" @open-change="isEditDialogOpen = $event">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
          <DialogDescription>Update the details of the team member.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid items-center grid-cols-4 gap-4">
            <Label for="name" class="text-right">Name</Label>
            <Input id="name" placeholder="John Doe" class="col-span-3"/>
          </div>
          <div class="grid items-center grid-cols-4 gap-4">
            <Label for="role" class="text-right">Role</Label>
            <Input id="role" placeholder="Project Manager" class="col-span-3"/>
          </div>
          <div class="grid items-center grid-cols-4 gap-4">
            <Label for="email" class="text-right">Email</Label>
            <Input id="email" type="email" placeholder="john.doe@example.com" class="col-span-3"/>
          </div>
          <div class="grid items-center grid-cols-4 gap-4">
            <Label for="phone" class="text-right">Phone</Label>
            <Input id="phone" placeholder="+1 (555) 123-4567" class="col-span-3"/>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" @click="isEditDialogOpen = false">Save Changes</Button>
          <Button variant="outline" @click="isEditDialogOpen = false">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Member Dialog -->
    <Dialog :open="isDeleteDialogOpen" @open-change="isDeleteDialogOpen = $event">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Member</DialogTitle>
          <DialogDescription>Are you sure you want to delete this team member?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive" @click="isDeleteDialogOpen = false">Delete</Button>
          <Button variant="outline" @click="isDeleteDialogOpen = false">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import {ref} from 'vue'
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Table, TableHeader, TableRow, TableHead, TableBody, TableCell} from '@/components/ui/table'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog'
import {Label} from '@/components/ui/label'
import {Input} from '@/components/ui/input'
import {CirclePlus, FilePenIcon, Trash2} from 'lucide-vue-next'

definePageMeta({
  layout: 'sidebar',
});

// State management using refs for dialogs
const isDialogOpen = ref(false)
const isEditDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)

// Example data
const members = ref([
  {
    name: 'John Doe',
    role: 'Project Manager',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567'
  },
  {
    name: 'Jane Smith',
    role: 'UI/UX Designer',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 987-6543'
  },
  {
    name: 'Michael Johnson',
    role: 'Software Engineer',
    email: 'michael.johnson@example.com',
    phone: '+1 (555) 456-7890'
  },
  {
    name: 'Emily Davis',
    role: 'Marketing Specialist',
    email: 'emily.davis@example.com',
    phone: '+1 (555) 321-0987'
  },
  {
    name: 'David Wilson',
    role: 'Sales Representative',
    email: 'david.wilson@example.com',
    phone: '+1 (555) 789-1234'
  }
])
</script>
