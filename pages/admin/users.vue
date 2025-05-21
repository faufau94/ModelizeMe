<template>
  <div class="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
    <div class="flex items-center justify-between space-y-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Utilisateurs
        </h2>
        <p class="text-muted-foreground">
          Liste des utilisateurs de l'application.
        </p>
      </div>
      <div class="flex items-center space-x-2">

        <Button @click="isAddDialogOpen = true">
          <CirclePlus :size="20" class="mr-2"/>
          Ajouter un utilisateur
        </Button>
        
        <!-- Add User Dialog -->
        <Dialog  v-model:open="isAddDialogOpen">
          <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter un utilisateur</DialogTitle>
              <DialogDescription>Remplir les champs.</DialogDescription>
            </DialogHeader>
            <form @submit="addUser">
            <div class="grid gap-4">
              <div class="grid grid-cols-2 gap-4">
                <FormField v-slot="{ componentField }" name="first_name">
                  <FormItem>
                    <FormLabel for="first-name">Prénom</FormLabel>
                    <FormControl>
                      <Input v-bind="componentField" id="first-name" placeholder="Max" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="name">
                  <FormItem>
                    <FormLabel for="last-name">Nom</FormLabel>
                    <FormControl>
                      <Input v-bind="componentField" id="last-name" placeholder="Robinson" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>

              <FormField v-slot="{ componentField }" name="email">
                <FormItem>
                  <FormLabel for="email">Email</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" id="email" type="email" placeholder="john@example.com" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="role">
                <FormItem>
                  <FormLabel>Rôle</FormLabel>
                  <Select v-bind="componentField" :disabled="roleStore.isFetching">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectionner un rôle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem :value="r.id" v-for="r in roleStore.roles">
                          {{ r.name }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>

                <FormDescription>
                  Un mot de passe sera généré automatiquement et envoyé à l'utilisateur par email.
            </FormDescription>
              </FormField>

              <div v-if="message.type !== ''">
                <div v-if="message.type === 'error'" class="w-full">
                  <div class="flex justify-start p-4 gap-x-2 rounded-md bg-red-50 border border-red-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-red-600">{{ message.text }}</p>
                  </div>
                </div>

                <div v-if="message.type === 'success'" class="w-full">
                  <div class="flex justify-start p-4 gap-x-2 rounded-md bg-green-50 border border-green-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-green-600">{{ message.text }}</p>
                  </div>
                </div>
              </div>

              <FormField name="button-submit">
                <FormControl class="">
                  <div class="flex justify-end gap-2">
                    <Button type="submit" :disabled="isFormLoading">
                      <Loader2 v-if="isFormLoading" class="w-4 h-4 mr-2 animate-spin"/>
                      {{ isFormLoading ? "Chargement..." : "Ajouter" }}
                    </Button>
                    <Button variant="outline" @click="isAddDialogOpen = false">Annuler</Button>
                  </div>
                </FormControl>
              </FormField>
            </div>
          </form>
          </DialogContent>
        </Dialog>

        <!-- Edit Member Dialog -->
        <Dialog v-model:open="isEditDialogOpen">
          <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editer un utilisateur</DialogTitle>
              <DialogDescription>Modifier les champs.</DialogDescription>
            </DialogHeader>
            <form @submit="editUser">
            <div class="grid gap-4">
              <div class="grid grid-cols-2 gap-4">
                <FormField v-slot="{ componentField }" name="first_name">
                  <FormItem>
                    <FormLabel for="first-name">Prénom</FormLabel>
                    <FormControl>
                      <Input v-bind="componentField" id="first-name" placeholder="Max" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="name">
                  <FormItem>
                    <FormLabel for="last-name">Nom</FormLabel>
                    <FormControl>
                      <Input v-bind="componentField" id="last-name" placeholder="Robinson" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>

              <FormField v-slot="{ componentField }" name="email">
                <FormItem>
                  <FormLabel for="email">Email</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" id="email" type="email" placeholder="john@example.com" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="role">
                <FormItem>
                  <FormLabel>Rôle</FormLabel>
                  <Select v-bind="componentField" :disabled="roleStore.isFetching">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectionner un rôle"  />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem :value="r.id" v-for="r in roleStore.roles">
                          {{ r.name }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              </FormField>

            

              <div v-if="message.type !== ''">
                <div v-if="message.type === 'error'" class="w-full">
                  <div class="flex justify-start p-4 gap-x-2 rounded-md bg-red-50 border border-red-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-red-600">{{ message.text }}</p>
                  </div>
                </div>

                <div v-if="message.type === 'success'" class="w-full">
                  <div class="flex justify-start p-4 gap-x-2 rounded-md bg-green-50 border border-green-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-green-600">{{ message.text }}</p>
                  </div>
                </div>
              </div>

              <FormField name="button-submit">
                <FormControl class="">
                  <div class="flex justify-end gap-2">
                    <Button type="submit" :disabled="isFormLoading">
                      <Loader2 v-if="isFormLoading" class="w-4 h-4 mr-2 animate-spin"/>
                      {{ isFormLoading ? "Chargement..." : "Modifier" }}
                    </Button>
                    <Button variant="outline" @click="isEditDialogOpen = false">Annuler</Button>
                  </div>
                </FormControl>
              </FormField>
            </div>
          </form>
          </DialogContent>
        </Dialog>

        <!-- Delete Member Dialog -->
        <Dialog v-model:open="isDeleteDialogOpen">
          <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Supprimer l'utilisateur</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="destructive"  @click.stop="onDeleteConfirm" :disabled="isFormLoading">
                    <Loader2 v-if="isFormLoading" class="w-4 h-4 mr-2 animate-spin"/>
                    {{ isFormLoading ? "Suppression..." : "Supprimer" }}
                </Button>
              <Button variant="outline" @click="isDeleteDialogOpen = false">Annuler</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        <!-- Create Workspace Dialog -->
        <Dialog v-model:open="isCreateWorkspaceDialogOpen">
          <DialogContent class="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un workspace</DialogTitle>
              <DialogDescription>
                Ce lien pourra être partagé avec d'autres utilisateurs.
              </DialogDescription>
            </DialogHeader>
            <div class="flex items-center space-x-2">
              <div class="grid flex-1 gap-2">
                <Label for="link" class="sr-only">
                  Lien
                </Label>
                <Input
                  id="link"
                  :default-value="workspaceLink.url"
                  readonly
                />
              </div>
              <Button size="sm" class="px-3" @click="copyLink(workspaceLink.url)">
                <span class="sr-only">Copy</span>
                <Copy class="w-4 h-4" />
              </Button>
            </div>

            <div v-if="message.type === 'copied'" class="w-full">
              <div class="flex justify-start p-4 gap-x-2 rounded-md bg-green-50 border border-green-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-green-600">{{ message.text }}</p>
              </div>
            </div>

            <DialogFooter class="sm:justify-end">
              <DialogClose as-child>
                <div class="flex justify-end gap-2">
                  <Button @click.stop="sendLink" :disabled="isFormLoading">
                      <Loader2 v-if="isFormLoading" class="w-4 h-4 mr-2 animate-spin"/>
                      {{ isFormLoading ? "Chargement..." : "Créer et envoyer le lien" }}
                    </Button>
                  <Button type="button" variant="secondary" @click="isCreateWorkspaceDialogOpen = false">
                    Annuler
                  </Button>                
                </div>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      </div>
    </div>
    <div v-if="isLoading" class="flex justify-center mt-32 items-center">
          <Loader2 :size="30" class="animate-spin"/>
        </div>
        <div v-else>

          <DataTable :data="users" :columns="columns" />
        </div>
  </div>
</template>
<script setup lang="ts">
import { getUserColumns } from '~/components/dataTable/user-columns'
import DataTable from '@/components/dataTable/DataTable.vue'
import { CirclePlus, Loader2, Copy } from 'lucide-vue-next';

import { useQuery } from '@tanstack/vue-query'

import { useUserStore } from '~/stores/api/user-store'

import { useForm } from 'vee-validate'
import {toTypedSchema} from "@vee-validate/zod";
import { z } from "zod/v4";;
import type { User } from '~/components/dataTable/data/schema';
import { useRoleStore } from '~/stores/api/role-store';
import { makeWorkspaceLink } from '~/utils/workspace-link';


definePageMeta({
    layout: 'sidebar-admin',
});


// State management using refs for dialogs
const isAddDialogOpen = ref(false)
const isEditDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isCreateWorkspaceDialogOpen = ref(false)

const roleStore = useRoleStore()
watch([isAddDialogOpen, isEditDialogOpen], ([newAddDialog, newEditDialog]) => {
  if (newAddDialog || newEditDialog) {
    roleStore.fetchRoles()
  }
})

const selectedUser = ref<User|null>(null)
const confirmDeleteUser = (user: User) => {
  isDeleteDialogOpen.value = true
  selectedUser.value = user
}

const onDeleteConfirm = async () => {
  if (selectedUser.value) {
    await userStore.deleteUser(selectedUser.value.id)
    
  }
  isDeleteDialogOpen.value = false
  selectedUser.value = null
}

const editUserDialog = (user: User) => {
  isEditDialogOpen.value = true
  selectedUser.value = user
  form.setValues({
    id: user.id,
    name: user.name,
    first_name: user.first_name,
    email: user.email,
    role: user.role.id,
  })
}

const workspaceLink = ref({
  url: '',
  inviteCode: '',
  userId: '',
  useEmail: '',
})

const createWorkspaceDialog = (user) => {

  // generate a link for the workspace
  const inviteCode = Math.random().toString(36).substring(2, 20)

  workspaceLink.value = {
    url: makeWorkspaceLink(inviteCode),
    inviteCode: inviteCode,
    userId: user.id,
    userEmail: user.email,
  }
  
  message.value = { type: '', text: '' }
  isCreateWorkspaceDialogOpen.value = true
}

const sendLink = async () => {
  isFormLoading.value = true
  
  // Save the link to the database and send it via email
  const res = await $fetch('/api/admin/workspaces/create', {
    method: 'POST',
    body: workspaceLink.value,
  })

  if (res?.status === 200) {
    setTimeout(() => {
      isFormLoading.value = false
      message.value = { type: 'success', text: res?.body.message }
      isCreateWorkspaceDialogOpen.value = false
    }, 2000)
  } else {
    message.value = { type: 'error', text: res?.body.message }
    isFormLoading.value = false
  }

  
}

const copyLink = (link: string) => {
  navigator.clipboard.writeText(link)
  message.value = { type: 'copied', text: 'Lien copié dans le presse-papier !' }
}

const userStore = useUserStore()
const columns = getUserColumns({ editUserDialog, confirmDeleteUser, createWorkspaceDialog })

const formSchema = toTypedSchema(z.object({
  name: z.string({
    error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : ""
  }).min(2, 'Le nom doit être supérieur à 2 caractères.').max(50),
  first_name: z.string({
    error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : ""
  }).min(2, 'Le nom doit être supérieur à 2 caractères.').max(50),
  email: z.string({
    error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : ""
  }).email({ message: "Adresse email invalide." }),
  role: z.number({
    error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : ""
  })
}))

const form = useForm({
  validationSchema: formSchema,
})


const message = ref({
  type: '',
  text: ''
})

const fetchUsers = () => $fetch('/api/admin/users/list')
const { data: users, isLoading, error, suspense } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
})

await suspense()

const isFormLoading = ref(false)
const addUser = form.handleSubmit(async (values) => {
  isFormLoading.value = true
  const res = await userStore.addUser(values)   

  // message de succès
  if(res.status === 200) {
    message.value = { type: 'success', text: res.body.message }
  }
  // on garde le dialog ouvert 3s le temps de voir le message
  setTimeout(() => {
    isAddDialogOpen.value = false
    form.resetForm()
    message.value = { type: '', text: '' }
    isFormLoading.value = false
  }, 2000)
})

const editUser = form.handleSubmit(async (values) => {
  isFormLoading.value = true
  const res = await userStore.editUser(values, selectedUser?.value?.id?.toString() || '')

  // message de succès
  if(res.status === 200) {
    message.value = { type: 'success', text: res.body.message }
  }
  // on garde le dialog ouvert 3s le temps de voir le message
  setTimeout(() => {
    isEditDialogOpen.value = false
    form.resetForm()
    message.value = { type: '', text: '' }
    isFormLoading.value = false
  }, 2000)
})
</script>