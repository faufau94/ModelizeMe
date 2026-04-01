<template>
  <div class="flex h-screen w-full bg-background overflow-hidden">
    <!-- Organization Sidebar -->
    <div class="w-16 border-r border-border bg-card flex flex-col items-center hidden md:flex py-4">
      <div class="flex flex-col items-center space-y-4 w-full px-2">
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
      <div class="flex justify-center py-6">
        <span class="text-xl font-bold ml-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">ModelizeMe</span>
      </div>
      
      <!-- Navigation Sidebar -->
      <SidebarProvider>
        <Sidebar side="left" variant="sidebar" collapsible="none">
          <SidebarHeader class="px-3">
            <!-- Main Navigation -->
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  @click="goToModelsPage"
                  :isActive="route.path.split('/').pop() === 'dashboard'"
                  class="py-5 cursor-pointer transition-all duration-200 hover:bg-accent hover:text-accent-foreground rounded-md"
                  :class="{ 'bg-accent text-accent-foreground': route.path.split('/').pop() === 'dashboard' }"
                >
                  <PanelTopIcon class="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                  <span class="font-medium">Modèles</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  @click="goToMembersPage"
                  :isActive="route.path.split('/').pop() === 'members'"
                  class="py-5 cursor-pointer transition-all duration-200 hover:bg-accent hover:text-accent-foreground rounded-md"
                  :class="{ 'bg-accent text-accent-foreground': route.path.split('/').pop() === 'members' }"
                >
                  <UsersRound class="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                  <span class="font-medium">Membres</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem v-if="getIsOwner">
                <SidebarMenuButton 
                  @click="goToSettingsPage" 
                  :isActive="route.path.split('/').pop() === 'settings'"
                  class="py-5 cursor-pointer transition-all duration-200 hover:bg-accent hover:text-accent-foreground rounded-md"
                  :class="{ 'bg-accent text-accent-foreground': route.path.split('/').pop() === 'settings' }"
                >
                  <Settings2 class="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                  <span class="font-medium">Paramètres</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

            <SidebarContent>
              <!-- Teams List -->
              <SidebarGroup>
                <div class="flex items-center justify-between px-3 py-2">
                  <SidebarGroupLabel class="text-xs font-semibold text-muted-foreground uppercase tracking-wider p-0">
                    Équipes
                  </SidebarGroupLabel>
                  <SidebarGroupAction class="transition-opacity duration-200 hover:opacity-100 opacity-70">
                    <CreateTeamDialog />
                  </SidebarGroupAction>
                </div>

                <SidebarGroupContent class="px-2">
                  <SidebarMenu>
                    <SidebarMenuItem v-for="team in selectedWorkspace?.teams" :key="team.id" class="group">
                      <SidebarMenuButton
                          asChild
                          :isActive="route.path === goToThisWorkspaceUrl('team/'+ team.id)"
                          class="py-6 transition-all duration-200 hover:bg-accent hover:text-accent-foreground rounded-md"
                          :class="{ 'bg-accent text-accent-foreground': route.path === goToThisWorkspaceUrl('team/'+ team.id) }"
                      >
                        <NuxtLink :to="goToThisWorkspaceUrl('team/'+ team?.id)" class="flex items-center gap-3 w-full">
                          <div class="flex flex-col">
                            <div class="flex items-center gap-2">
                              <div class="transition-transform duration-200 group-hover:scale-110">
                                <div class="w-3 h-3 rounded-full" :class="teamColorClass(team?.color)"></div>
                              </div>
                              <div class="font-medium truncate">
                                {{ team.name }}
                              </div>
                            </div>
                            <div class="flex">
                              <div class="w-5"></div>
                              <div class="flex items-center gap-4 mt-1">
                                <div class="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users class="h-3 w-3" />
                                  <span>{{ team?.members?.length || 0 }}</span>
                                </div>
                                <div class="flex items-center gap-1 text-xs text-muted-foreground">
                                  <PanelTopIcon class="h-3 w-3" />
                                  <span>{{ team.models?.length || 0 }}</span>
                                </div>
                              </div>
                            </div>

                          </div>
                        </NuxtLink>
                      </SidebarMenuButton>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-300 rounded-sm">
                            <MoreHorizontalIcon class="h-6 w-6" />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" class="w-48">
                          <DropdownMenuItem class="cursor-pointer" @click.stop="openManageTeamDialog(team.id)">
                            <Users class="mr-2 h-4 w-4" />
                            <span>Gérer l'équipe</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem class="cursor-pointer">
                            <AlertDialog v-model:open="showDialogRenameTeam">
                              <AlertDialogTrigger as-child>
                                <div @click.stop="showDialogRenameTeam = true" class="flex items-center w-full">
                                  <PencilIcon class="mr-2 h-4 w-4" />
                                  <span>Renommer</span>
                                </div>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Renommer l'équipe</AlertDialogTitle>
                                </AlertDialogHeader>
                                <Form
                                    v-slot="{ handleSubmit }"
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
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <div class="flex items-center w-full">
                                <Paintbrush class="mr-2 h-4 w-4" />
                                <span>Changer la couleur</span>
                              </div>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem
                                    class="cursor-pointer"
                                    v-for="color in colors"
                                    @click.stop="updateTeamColor(team.id, color)"
                                    :key="color"
                                >
                                  <div class="flex items-center gap-2">
                                    <div class="w-3 h-3 rounded-full" :class="teamColorClass(color)"></div>
                                    {{ color.charAt(0).toUpperCase() + color.slice(1) }}
                                  </div>
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem class="cursor-pointer text-destructive focus:text-destructive">
                            <AlertDialog>
                              <AlertDialogTrigger as-child>
                                <div @click.stop="showDialogDeleteTeam = true" class="flex items-center w-full">
                                  <Trash2 class="mr-2 h-4 w-4" />
                                  <span>Supprimer</span>
                                </div>
                              </AlertDialogTrigger>
                              <AlertDialogContent v-if="showDialogDeleteTeam">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Voulez-vous supprimer cette équipe ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible et supprimera définitivement cette équipe.
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
    <Sheet v-model:open="isMobileSheetOpen">
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" class="absolute left-4 top-4 md:hidden transition-all duration-200 hover:bg-accent">
          <MenuIcon class="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" class="w-72 p-0">
        <!-- Logo -->
        <div class="flex justify-center py-6 border-b border-border">
          <span class="text-xl font-bold ml-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">ModelizeMe</span>
        </div>
        
        <!-- Mobile Navigation Menu -->
        <ScrollArea class="h-[calc(100vh-8.5rem)]">
          <nav class="py-3">
            <!-- Workspace Switcher (Mobile) -->
            <div class="px-3 mb-3">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" class="w-full justify-between h-11">
                    <div class="flex items-center gap-2">
                      <div class="flex items-center justify-center h-6 w-6 rounded-md bg-primary text-primary-foreground text-xs font-medium">
                        {{ selectedWorkspace?.name?.charAt(0).toUpperCase() }}
                      </div>
                      <span class="font-medium truncate">{{ selectedWorkspace?.name }}</span>
                    </div>
                    <ChevronsUpDown class="h-4 w-4 text-muted-foreground shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="w-64" align="start">
                  <DropdownMenuLabel class="text-xs text-muted-foreground">Espaces de travail</DropdownMenuLabel>
                  <DropdownMenuItem
                    v-for="workspace in workspaces"
                    :key="workspace.id"
                    @click="closeMobileSheet(); switchWorkspace(workspace.id)"
                    class="cursor-pointer gap-2 p-2"
                  >
                    <div class="flex items-center justify-center h-6 w-6 rounded-sm border text-xs font-medium shrink-0">
                      {{ workspace.name?.charAt(0).toUpperCase() }}
                    </div>
                    <span class="truncate">{{ workspace.name }}</span>
                    <Check v-if="workspace.id === selectedWorkspace?.id" class="ml-auto h-4 w-4 text-primary shrink-0" />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="cursor-pointer gap-2 p-2" @click="closeMobileSheet(); isAddWorkspaceDialogOpen = true">
                    <div class="flex items-center justify-center h-6 w-6 rounded-sm border bg-transparent shrink-0">
                      <Plus class="h-3.5 w-3.5" />
                    </div>
                    <span class="font-medium text-muted-foreground">Ajouter un espace de travail</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div class="px-3 mb-2">
              <div class="space-y-1">
                <Button @click="closeMobileSheet(); goToModelsPage()" :variant="route.path.split('/').pop() === 'dashboard' ? 'secondary' : 'ghost'" class="w-full justify-start transition-all duration-200 hover:bg-accent">
                  <PanelTopIcon class="mr-2 h-4 w-4" />
                  <span class="font-medium">Modèles</span>
                </Button>
                <Button @click="closeMobileSheet(); goToMembersPage()" :variant="route.path.split('/').pop() === 'members' ? 'secondary' : 'ghost'" class="w-full justify-start transition-all duration-200 hover:bg-accent">
                  <UsersRound class="mr-2 h-4 w-4" />
                  <span class="font-medium">Membres</span>
                </Button>
                <Button v-if="getIsOwner" @click="closeMobileSheet(); goToSettingsPage()" :variant="route.path.split('/').pop() === 'settings' ? 'secondary' : 'ghost'" class="w-full justify-start transition-all duration-200 hover:bg-accent">
                  <Settings2 class="mr-2 h-4 w-4" />
                  <span class="font-medium">Paramètres</span>
                </Button>
              </div>
            </div>
            
            <!-- Teams Section with Simple List -->
            <div class="px-3 mb-2 mt-6">
              <div class="flex items-center justify-between px-3 mb-2">
                <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Équipes</h3>
                <CreateTeamDialog />
              </div>
              
              <div class="mt-2 space-y-1">
                <!-- Teams dynamiques -->
                <div v-for="team in selectedWorkspace?.teams" :key="team.id" class="group rounded-md hover:bg-accent transition-all duration-200">
                  <NuxtLink :to="goToThisWorkspaceUrl('team/'+ team.id)" @click="closeMobileSheet()" class="flex items-center gap-3 w-full px-3 py-2">
                    <div class="flex flex-col">
                      <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full" :class="teamColorClass(team?.color)"></div>
                        <div class="font-medium truncate">{{ team.name }}</div>
                      </div>
                      <div class="flex">
                        <div class="w-5"></div>
                        <div class="flex items-center gap-4 mt-1">
                          <div class="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users class="h-3 w-3" />
                            <span>{{ team?.members?.length || 0 }}</span>
                          </div>
                          <div class="flex items-center gap-1 text-xs text-muted-foreground">
                            <PanelTopIcon class="h-3 w-3" />
                            <span>{{ team.models?.length || 0 }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>

    <!-- Mobile: standalone dialogs (rendered outside Sheet) -->
    <AddWorkspaceDialog v-model:open="isAddWorkspaceDialogOpen" :isOnlyIcon="false" class="hidden" />
    
    <!-- Main Content -->
    <div class="flex-1 overflow-auto">
      <header class="h-16 px-6 flex items-center">
        <!-- <h1 class="text-lg font-semibold text-foreground md:ml-0 ml-12">Vue d'ensemble</h1> -->
        <div class="ml-auto flex items-center space-x-3">
          <!-- Invite Members: icon-only on mobile, full on desktop -->
          <Button
            size="icon"
            class="md:hidden items-center gap-2 transition-colors bg-transparent text-black hover:bg-gray-100 hover:text-black border border-gray-300"
            @click="isInviteDialogOpen = true"
          >
            <UserRoundPlus class="w-4 h-4" />
          </Button>
          <InviteMembersDialog v-model:open="isInviteDialogOpen" />

          <!-- User Account Dropdown -->
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" class="relative h-8 w-8 rounded-full transition-all duration-200 hover:bg-accent hover:ring-2 hover:ring-ring hover:ring-offset-2">
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
                  <UserIcon class="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem class="cursor-pointer">
                  <CreditCardIcon class="mr-2 h-4 w-4" />
                  <span>Facturation</span>
                </DropdownMenuItem>
                <DropdownMenuItem class="cursor-pointer">
                  <SettingsIcon class="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <div class="flex items-center w-full">
                      <Languages class="mr-2 h-4 w-4" />
                      <span>Langue</span>
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem class="cursor-pointer" @click="selectedLanguage = 'English'">
                        <Check v-if="selectedLanguage === 'English'" class="mr-2 h-4 w-4" />
                        <span :class="selectedLanguage !== 'English' ? 'ml-6' : ''">English</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem class="cursor-pointer" @click="selectedLanguage = 'French'">
                        <Check v-if="selectedLanguage === 'French'" class="mr-2 h-4 w-4" />
                        <span :class="selectedLanguage !== 'French' ? 'ml-6' : ''">Français</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="cursor-pointer text-destructive focus:text-destructive">
                <NuxtLink class="flex items-center w-full" @click.prevent="signOut">
                  <LogOutIcon class="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
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

    <!-- Manage Team Dialog (contrôlé par le parent) -->
    <ManageTeamDialog
      v-model:open="isManageTeamDialogOpen"
      :team-id="currentTeamId"
    />
  </div>
</template>


<script setup lang="ts">

import {ref} from 'vue';
import {useWorkspace} from '@/composables/api/useWorkspace';
import {useTeam} from '@/composables/api/useTeam';
import WorkspacesSidebar from '@/components/WorkspacesSidebar.vue'
import AddWorkspaceDialog from '@/components/workspace/AddWorkspaceDialog.vue'
import CreateTeamDialog from '@/components/teams/CreateTeamDialog.vue'
import InviteMembersDialog from '@/components/workspace/InviteMembersDialog.vue'
import ManageTeamDialog from '@/components/teams/ManageTeamDialog.vue'
import { teamColorClass } from "~/utils";

import {
  Check,
  ChevronsUpDown,
  Circle,
  CreditCardIcon,
  Globe,
  Languages,
  Loader2,
  LogOutIcon,
  MenuIcon,
  MoreHorizontalIcon,
  Paintbrush,
  PanelTopIcon,
  PencilIcon,
  Plus,
  Settings2,
  SettingsIcon,
  Trash2,
  UserIcon,
  UserRoundPlus,
  UsersRound,
  Users,
  PlusIcon
} from 'lucide-vue-next'

import {Button} from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu'
import {Avatar} from '@/components/ui/avatar'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Sheet, SheetContent, SheetTrigger} from '@/components/ui/sheet'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select'
import {toast} from 'vue-sonner';
import {z} from "zod/v4";
import {authClient, useSession} from '~/lib/auth-client';
import {NuxtLink} from '#components';



const route = useRoute()
const { data } = await useSession(useFetch);

const copiedWorkspaceLink = ref(false)

const { selectedWorkspace, copyWorkspaceLink, goToThisWorkspaceUrl, getIsOwner, workspaces, switchWorkspace } = useWorkspace()
const isInviteDialogOpen = ref(false)
const selectedLanguage = ref('French')
const isMobileSheetOpen = ref(false)
const isAddWorkspaceDialogOpen = ref(false)

const closeMobileSheet = () => {
  isMobileSheetOpen.value = false
}
 const { renameTeam, deleteTeam, updateTeam } = useTeam()

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
const removeTeam = async (teamId: string) => {
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
  await renameTeam(values.teamId, values.name)

  isRenamingTeam.value = false
  showDialogRenameTeam.value = false

  toast.success('Le modèle a été renommé avec succès.');
}


const updateTeamColor = async (teamId: string, color: string) => {
  try {
    console.log('Updating team color:', teamId, color)
    await updateTeam(teamId, { color })
    toast.success('Couleur de l\'équipe mise à jour avec succès')
  } catch (error) {
    console.error('Error updating team color:', error)
    toast.error('Erreur lors de la mise à jour de la couleur de l\'équipe')
  }
}


const signOut = async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        navigateTo('/', { replace: true, external: true })
      },
    },
  })
}

const colors = ['blue', 'green', 'purple', 'orange', 'red']

// État pour contrôler le Dialog ManageTeamDialog
const currentTeamId = ref('')
const isManageTeamDialogOpen = ref(false)

// Fonction pour ouvrir le dialog de gestion d'équipe
const openManageTeamDialog = (teamId: string) => {
  currentTeamId.value = teamId
  isManageTeamDialogOpen.value = true
}
</script>