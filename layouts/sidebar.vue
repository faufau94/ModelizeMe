<template>
  <div class="flex h-screen w-full bg-background">
    <!-- Organization Sidebar -->
    <div class="w-16 border-r border-border bg-card flex flex-col items-center hidden md:flex">
      <div class="flex flex-col items-center space-y-4">
        <!-- Organization Logo -->
        
        <!-- Organization Selector - No Popover -->
        <WorkspacesSidebar />
        
        <!-- Add Organization Button -->
        <AddWorkspaceDialog :isOnlyIcon="true"/>
      </div>
    </div>

    <!-- Navigation Sidebar -->
    <div class="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
      <!-- Logo -->
      <div class="flex justify-center py-4">
        <span class="text-xl font-bold ml-2">ModelizeMe</span>
      </div>
      
      <!-- Navigation Sidebar -->
      <SidebarProvider>
        <Sidebar side="left" variant="sidebar" collapsible="none">
          <SidebarHeader>
            <!-- Main Navigation -->
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  @click="goToModelsPage"
                  :isActive="route.path.split('/').pop() === 'dashboard'"
                >
                  <PanelTopIcon />
                  <span>Modèles</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  @click="goToMembersPage"
                  :isActive="route.path.split('/').pop() === 'members'"
                >
                  <UsersRound />
                  <span>Membres</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem >
                <SidebarMenuButton 
                  @click="goToSettingsPage" 
                  :isActive="route.path.split('/').pop() === 'settings'"
                >
                  <Settings2 />
                  <span>Paramètres</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <!-- Teams List -->
            <SidebarGroup>
              <SidebarGroupLabel class="font-normal text-muted-foreground uppercase tracking-wider">
                Équipes
              </SidebarGroupLabel>
              <SidebarGroupAction>
                <CreateTeamDialog />
              </SidebarGroupAction>

              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem v-for="team in selectedWorkspace?.teams" :key="team.id">
                    <SidebarMenuButton asChild>
                      <a href="#">{{ team.name }}</a>
                    </SidebarMenuButton>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction>
                          <MoreHorizontalIcon class="h-4 w-4" />
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                                    <DropdownMenuItem class="cursor-pointer">
              <AlertDialog v-model:open="showDialogRenameTeam">
                <AlertDialogTrigger as-child>
                  <div @click.stop="showDialogRenameTeam = true">
                    Renommer
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Renommer l'équipe</AlertDialogTitle>
                    <AlertDialogDescription>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                    <Form 
                    v-slot="{ handleSubmit, values }" 
                    :initial-values="{ name: team.name }" 
                    :validation-schema="formSchema"
                    >
                    <form @submit="handleSubmit($event, (formValues) => rnTeam({ ...formValues, teamId: team.id }))">
                    <FormField v-slot="{ componentField }" name="name">
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input type="text" v-bind="componentField"/>
                        </FormControl>
                        <FormMessage />
                        <FormControl class="float-right">
                          <Button type="submit" :disabled="isRenamingTeam">
                            <Loader2 v-if="isRenamingTeam" class="w-4 h-4 mr-2 animate-spin"/>
                            {{ isRenamingTeam ? 'Renommage...' : 'Renommer' }}
                          </Button>
                            <Button type="button" variant="secondary" @click.stop="showDialogRenameTeam = false">
                              Annuler
                            </Button>
                        </FormControl>
                      </FormItem>
                    </FormField>
                  </form>
                  </Form>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuItem>
                        <DropdownMenuSeparator />
                          <DropdownMenuItem class="cursor-pointer">
                            <AlertDialog>
                              <AlertDialogTrigger as-child>
                                <div @click.stop="showDialogDeleteTeam = true" class="text-red-500">
                                  Supprimer
                                </div>
                              </AlertDialogTrigger>
                              <AlertDialogContent v-if="showDialogDeleteTeam">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Voulez-vous supprimer ce modèle ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible et supprimera définitement ce modèle.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <Button variant="destructive" @click.stop="removeTeam(team.id)" :disabled="isDeletingTeam">
                                    <Loader2 v-if="isDeletingTeam" class="w-4 h-4 mr-2 animate-spin"/>
                                    {{ isDeletingTeam ? 'Suppression...' : 'Supprimer' }}
                                  </Button>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </div>
    
    <!-- Mobile Navigation -->
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" class="absolute left-4 top-4 md:hidden">
          <MenuIcon class="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" class="w-72 p-0">
        <!-- Logo -->
        <div class="flex justify-center py-4">
          <span class="text-xl font-bold ml-2">ModelizeMe</span>
        </div>
        
        <!-- Mobile Navigation Menu -->
        <ScrollArea class="h-[calc(100vh-8.5rem)]">
          <nav class="py-3">
            <div class="px-3 mb-2">
              <div class="space-y-1">
                <Button @click="goToModelsPage" :variant="route.path.split('/').pop() === 'dashboard' ? 'secondary' : 'ghost'" class="w-full justify-start">
                  <PanelTopIcon class="mr-2 h-4 w-4" />
                  Modèles
                </Button>
                <Button @click="goToMembersPage" :variant="route.path.split('/').pop() === 'members' ? 'secondary' : 'ghost'" class="w-full justify-start">
                  <UsersRound class="mr-2 h-4 w-4" />
                  Membres
                </Button>
                <Button v-if="data?.user?.id === selectedWorkspace?.ownerId" @click="goToSettingsPage" :variant="route.path.split('/').pop() === 'settings' ? 'secondary' : 'ghost'" class="w-full justify-start">
                  <Settings2 class="mr-2 h-4 w-4" />
                  Paramètes
                </Button>
              </div>
            </div>
            
            <!-- Teams Section with Simple List -->
            <div class="px-3 mb-2 mt-6">
              <div class="flex items-center justify-between px-3">
                <h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Équipes</h3>
                <Button variant="ghost" size="icon" class="h-6 w-6">
                  <PlusIcon class="h-4 w-4" />
                </Button>
              </div>
              
              <div class="mt-2 space-y-1">
                <!-- Team 1 - Separate Button and Dropdown -->
                <div class="flex items-center">
                  <Button variant="ghost" class="flex-1 justify-start" asChild>
                    <a href="#">Équipe 1</a>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" class="h-8 w-8">
                        <MoreHorizontalIcon class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <PencilIcon class="mr-2 h-4 w-4" />
                        <span>Renommer</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem class="text-destructive focus:text-destructive">
                        <TrashIcon class="mr-2 h-4 w-4" />
                        <span>Supprimer</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <!-- Team 2 - Separate Button and Dropdown -->
                <div class="flex items-center">
                  <Button variant="ghost" class="flex-1 justify-start" asChild>
                    <a href="#">Équipe 2</a>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" class="h-8 w-8">
                        <MoreHorizontalIcon class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <PencilIcon class="mr-2 h-4 w-4" />
                        <span>Renommer</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <LinkIcon class="mr-2 h-4 w-4" />
                        <span>Copier le lien</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem class="text-destructive focus:text-destructive">
                        <TrashIcon class="mr-2 h-4 w-4" />
                        <span>Supprimer</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <!-- Team 3 - Separate Button and Dropdown -->
                <div class="flex items-center">
                  <Button variant="ghost" class="flex-1 justify-start" asChild>
                    <a href="#">Équipe 3</a>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" class="h-8 w-8">
                        <MoreHorizontalIcon class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <PencilIcon class="mr-2 h-4 w-4" />
                        <span>Renommer</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <LinkIcon class="mr-2 h-4 w-4" />
                        <span>Copier le lien</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem class="text-destructive focus:text-destructive">
                        <TrashIcon class="mr-2 h-4 w-4" />
                        <span>Supprimer</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
    
    <!-- Main Content -->
    <div class="flex-1 overflow-auto">
      <header class="h-14 px-6 flex items-center">
        <!-- <h1 class="text-lg font-semibold text-foreground md:ml-0 ml-12">Vue d'ensemble</h1> -->
        <div class="ml-auto flex items-center space-x-4">
            <InviteMembersDialog />

          <Select>
            <SelectTrigger class="w-36">
              <div class="flex items-center justify-center gap-4">
                <Globe class="h-4 w-4" />
                <SelectValue placeholder="Language" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem class="cursor-pointer" value="english">
                  English
                </SelectItem>
                <SelectItem class="cursor-pointer" value="French">
                  French
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <!-- User Account Dropdown (Updated) -->
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" class="relative h-8 w-8 rounded-full">
                <Avatar class="h-8 w-8">
                  {{ data?.user?.name?.charAt(0).toUpperCase()  }}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-56" align="end">
              <DropdownMenuLabel class="font-normal">
                <div class="flex flex-col space-y-1">
                  <p class="text-sm font-medium leading-none">
                    {{ data?.user?.name  }}
                  </p>
                  <p class="text-xs leading-none text-muted-foreground">
                    {{ data?.user?.email  }}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem class="cursor-pointer">
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem class="cursor-pointer">
                  Facturation
                </DropdownMenuItem>
                <DropdownMenuItem class="cursor-pointer">
                  Paramètres
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <NuxtLink class="cursor-pointer" @click.prevent="signOut">
                  Se déconnecter
                </NuxtLink>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <!-- Main Content -->
      <main>
        <slot></slot>
      </main>
    </div>
  </div>
</template>


<script setup lang="ts">

import { ref } from 'vue';
import { useWorkspace } from '@/composables/api/useWorkspace';
import { useTeam } from '@/composables/api/useTeam';
import WorkspacesSidebar from '@/components/WorkspacesSidebar.vue'
import AddWorkspaceDialog from '@/components/workspace/AddWorkspaceDialog.vue'
import CreateTeamDialog from '@/components/teams/CreateTeamDialog.vue'
import InviteMembersDialog from '@/components/workspace/InviteMembersDialog.vue'

import { 
  HomeIcon, 
  UsersIcon, 
  SettingsIcon, 
  LogOutIcon,
  BellIcon,
  PlusIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ChevronDownIcon,
  MenuIcon,
  UserIcon,
  MoreHorizontalIcon,
  LinkIcon,
  PencilIcon,
  TrashIcon,
  CodeIcon,
  CheckIcon,
  PanelTopIcon,
  Search,
  Loader2,
  UsersRound,
  Globe,
  Plus,
  BoxSelectIcon,
  PlusCircle,
  Share2,
  Settings2,
} from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'vue-sonner';
import { z } from "zod/v4";
import { useSession, authClient } from '~/lib/auth-client';

const route = useRoute()
const { data } = await useSession(useFetch);

const copiedWorkspaceLink = ref(false)

const { selectedWorkspace, copyWorkspaceLink, goToThisWorkspaceUrl } = useWorkspace()
 const { renameTeam, deleteTeam } = useTeam()

const copyLink = async () => {
  try {
    await copyWorkspaceLink()
    copiedWorkspaceLink.value = true
    setTimeout(() => {
      copiedWorkspaceLink.value = false
    }, 2000)
  } catch (error) {
    
  }
}

const goToMembersPage = async () => {
  const url = goToThisWorkspaceUrl('members')
  await navigateTo(url)
}

const goToModelsPage = async () => {
  const url = goToThisWorkspaceUrl('dashboard')
  await navigateTo(url)
}

const goToSettingsPage = async () => {
  const url = goToThisWorkspaceUrl('settings')
  await navigateTo(url)
}

const showDialogDeleteTeam = ref(false)
const isDeletingTeam = ref(false)
const removeTeam = async (teamId: Number) => {
  try {
    await deleteTeam(teamId)
    toast.success('Équipe supprimée avec succès')
  } catch (error) {
    console.error('Error removing team:', error)
    toast.error('Erreur lors de la suppression de l\'équipe')
  }
}


const formSchema = toTypedSchema(z.object({
  name: z.string({
    error: (issue) => issue.input === undefined
      ? "Veuillez remplir le champs."
      : ""
  }).min(2, 'Le nom doit être supérieur à 2 caractères.').max(50),
}))


const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: ''
  },
  validateOnMount: false,
})


const isRenamingTeam = ref(false)
const showDialogRenameTeam = ref(false)
const rnTeam = async (values) => {
  isRenamingTeam.value = true
  renameTeam(values.teamId,values.name)

  isRenamingTeam.value = false
  showDialogRenameTeam.value = false

  toast.success('Le modèle a été renommé avec succès.');
}


const signOut = async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: async () => {
        await navigateTo('/')
      },
    },
  })
}
</script>