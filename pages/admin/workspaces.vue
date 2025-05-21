<template>
    <div class="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div class="flex items-center justify-between space-y-2">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">
            Workspaces
          </h2>
          <p class="text-muted-foreground">
            Liste des workspaces de l'application.
          </p>
        </div>
        <div class="flex items-center space-x-2">
  
          <Button @click="isAddDialogOpen = true">
            <CirclePlus :size="20" class="mr-2"/>
            Ajouter un workspace
          </Button>
          
          <!-- Add Workspace Dialog -->
          <Dialog  v-model:open="isAddDialogOpen">
            <DialogContent class="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Ajouter un workspace</DialogTitle>
                <DialogDescription>Remplir les champs.</DialogDescription>
              </DialogHeader>
              <form @submit="addWorkspace">
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
              <form @submit="editWorkspace">
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
                <DialogTitle>Supprimer le workspace</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer cet workspace ? Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>

                <div v-if="message.type === 'success'" class="w-full">
                    <div class="flex justify-start p-4 gap-x-2 rounded-md bg-green-50 border border-green-300">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p class="text-green-600">{{ message.text }}</p>
                    </div>
                  </div>

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
                <DialogTitle>Créer un espace de travail</DialogTitle>
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

              <div v-if="message.type === 'success'" class="w-full">
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
  
            <DataTable :data="workspaces" :columns="columns" />
          </div>
    </div>
  </template>
  <script setup lang="ts">
  import { getWorkspaceColumns } from '~/components/dataTable/workspace-columns'
  import DataTable from '@/components/dataTable/DataTable.vue'
  import { CirclePlus, Loader2, Copy } from 'lucide-vue-next';
  
  import { useQuery } from '@tanstack/vue-query'
  
  import { useWorkspaceStore } from '@/stores/admin/workspace-store.ts'
  
  import { useForm } from 'vee-validate'
  import {toTypedSchema} from "@vee-validate/zod";
  import { z } from "zod/v4";;
  import type { Workspace } from '~/components/dataTable/data/schema';
  import { useRoleStore } from '@/stores/admin/role-store';
  import { makeWorkspaceLink } from '~/utils/workspace-link';
  
  
  definePageMeta({
      layout: 'sidebar-admin',
  });
  
  
  // State management using refs for dialogs
  const isAddDialogOpen = ref(false)
  const isEditDialogOpen = ref(false)
  const isDeleteDialogOpen = ref(false)
  const isCreateWorkspaceDialogOpen = ref(false)
  
  const workspaceStore = useWorkspaceStore()

  const roleStore = useRoleStore()
  watch([isAddDialogOpen, isEditDialogOpen], ([newAddDialog, newEditDialog]) => {
    if (newAddDialog || newEditDialog) {
      roleStore.fetchRoles()
    }
  })
  
  const selectedWorkspace = ref<Workspace|null>(null)
  const confirmDeleteWorkspace = (workspace: Workspace) => {
    isDeleteDialogOpen.value = true
    selectedWorkspace.value = workspace
  }
  
  const onDeleteConfirm = async () => {
    isFormLoading.value = true
    if (selectedWorkspace.value) {        
      await workspaceStore.deleteWorkspace(selectedWorkspace?.value?.id)
      message.value = { type: 'success', text: 'Workspace supprimé avec succès.' }
    }
    setTimeout(() => {
        selectedWorkspace.value = null
        isFormLoading.value = false
        isDeleteDialogOpen.value = false
        message.value = { type: '', text: '' }
    }, 2000)
  }
  
  
  const workspaceLink = ref({
    url: '',
    inviteCode: '',
    userId: '',
  })
  
  const createWorkspaceDialog = (workspace: Workspace) => {
  
    // generate a link for the class
    const workspaceName = Math.random().toString(36).substring(2, 20)
  
    workspaceLink.value = {
      url: makeWorkspaceLink(workspaceName),
      inviteCode: workspaceName,
      userId: workspace.id,
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
        message.value = { type: 'success', text: res?.body.message }
      setTimeout(() => {
        isFormLoading.value = false
        isCreateWorkspaceDialogOpen.value = false
        message.value = { type: '', text: '' }
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
  
  const columns = getWorkspaceColumns({ confirmDeleteWorkspace, createWorkspaceDialog })
  
  const formSchema = toTypedSchema(z.object({
    name: z.string({
      error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : ""
    }).min(2, 'Le nom doit être supérieur à 2 caractères.').max(50),
    owner: z.string({
      error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : ""
    }),
    inviteCode: z.string({
      error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : ""
    }).min(2, 'Le nom doit être supérieur à 2 caractères.').max(50),
  }))
  
  const form = useForm({
    validationSchema: formSchema,
  })
  
  
  const message = ref({
    type: '',
    text: ''
  })
  
  const fetchWorkspaces = () => $fetch('/api/admin/workspaces/list')
  const { data: workspaces, isLoading, error, suspense } = useQuery({
    queryKey: ['workspaces'],
    queryFn: fetchWorkspaces,
  })
  
  await suspense()
  
  const isFormLoading = ref(false)
  const addWorkspace = form.handleSubmit(async (values) => {
    isFormLoading.value = true
    const res = await workspaceStore.addWorkspace(values)   
  
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
  
  const editWorkspace = form.handleSubmit(async (values) => {
    isFormLoading.value = true
    const res = await workspaceStore.editWorkspace(values, selectedWorkspace?.value?.id?.toString() || '')
  
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