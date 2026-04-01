<template>
  <div class="flex h-screen w-full bg-background overflow-hidden">
    <!-- Organization Sidebar (icon rail) -->
    <div class="w-14 border-r border-border/50 bg-muted/30 flex-col items-center hidden md:flex py-3 gap-2">
      <div class="flex flex-col items-center gap-2 w-full px-2 flex-1">
        <WorkspacesSidebar />
        <AddWorkspaceDialog :isOnlyIcon="true"/>
      </div>
    </div>

    <!-- Navigation Sidebar -->
    <div class="w-60 border-r border-border/50 bg-muted/20 flex-col hidden md:flex">
      <!-- Workspace header -->
      <div class="h-14 flex items-center px-4 border-b border-border/50">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="flex items-center justify-center h-7 w-7 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shrink-0">
            {{ selectedWorkspace?.name?.charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold truncate leading-tight">{{ selectedWorkspace?.name }}</p>
            <p class="text-[11px] text-muted-foreground leading-tight">Workspace</p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-3 py-3">
        <!-- Main nav -->
        <div class="space-y-0.5">
          <button
            @click="goToDashboardPage"
            class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            :class="isCurrentPage('')
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'"
          >
            <LayoutDashboard class="h-4 w-4 shrink-0" />
            Dashboard
          </button>

          <button
            @click="goToModelsPage"
            class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            :class="isCurrentPage('models')
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'"
          >
            <PanelTopIcon class="h-4 w-4 shrink-0" />
            Modèles
          </button>

          <button
            @click="goToMembersPage"
            class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            :class="isCurrentPage('members')
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'"
          >
            <UsersRound class="h-4 w-4 shrink-0" />
            Membres
          </button>

          <button
            v-if="getIsOwner"
            @click="goToSettingsPage"
            class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            :class="isCurrentPage('settings')
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'"
          >
            <Settings2 class="h-4 w-4 shrink-0" />
            Paramètres
          </button>
        </div>

        <!-- Teams section -->
        <div class="mt-6">
          <div class="flex items-center justify-between px-2.5 mb-2">
            <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Équipes</span>
            <CreateTeamDialog />
          </div>

          <div class="flex flex-col gap-1.5">
            <NuxtLink
              v-for="team in selectedWorkspace?.teams" :key="team.id"
              :to="goToThisWorkspaceUrl('team/'+ team.id)"
              class="no-underline"
            >
              <Item
                variant="outline"
                size="sm"
                :class="route.path === goToThisWorkspaceUrl('team/'+ team.id)
                  ? 'bg-accent border-accent'
                  : 'bg-white dark:bg-background hover:bg-accent/50'"
              >
                <div class="w-3.5 h-3.5 rounded-full shrink-0" :class="teamColorClass(team?.color)"></div>
                <ItemContent>
                  <ItemTitle class="text-sm">{{ team.name }}</ItemTitle>
                  <ItemDescription class="text-[11px]">
                    <span class="flex items-center gap-3">
                      <span class="flex items-center gap-1">
                        <Users class="h-3 w-3" />{{ team?.members?.length || 0 }}
                      </span>
                      <span class="flex items-center gap-1">
                        <PanelTopIcon class="h-3 w-3" />{{ team.models?.length || 0 }}
                      </span>
                    </span>
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        class="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 rounded-md hover:bg-accent cursor-pointer"
                        @click.prevent.stop
                      >
                        <MoreHorizontalIcon class="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
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
                </ItemActions>
              </Item>
            </NuxtLink>
          </div>
        </div>
      </nav>
    </div>

    <!-- Mobile: standalone dialogs (rendered outside Sheet) -->
    <AddWorkspaceDialog v-model:open="isAddWorkspaceDialogOpen" :isOnlyIcon="false" class="hidden" />
    
    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top bar -->
      <header class="h-14 px-6 flex items-center border-b border-border/50 shrink-0 relative">
        <!-- Mobile menu trigger -->
        <Sheet v-model:open="isMobileSheetOpen">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" class="md:hidden mr-2 h-8 w-8">
              <MenuIcon class="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" class="w-72 p-0">
            <!-- Mobile nav content -->
            <div class="flex items-center gap-2.5 px-4 py-4 border-b border-border">
              <div class="flex items-center justify-center h-7 w-7 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                {{ selectedWorkspace?.name?.charAt(0).toUpperCase() }}
              </div>
              <span class="text-sm font-semibold truncate">{{ selectedWorkspace?.name }}</span>
            </div>
            <ScrollArea class="h-[calc(100vh-8rem)]">
              <nav class="px-3 py-3">
                <!-- Workspace Switcher (Mobile) -->
                <div class="mb-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="outline" class="w-full justify-between h-9 text-sm">
                        <span class="truncate">Changer de workspace</span>
                        <ChevronsUpDown class="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
                        <div class="flex items-center justify-center h-5 w-5 rounded-md border text-[10px] font-medium shrink-0">
                          {{ workspace.name?.charAt(0).toUpperCase() }}
                        </div>
                        <span class="truncate text-sm">{{ workspace.name }}</span>
                        <Check v-if="workspace.id === selectedWorkspace?.id" class="ml-auto h-3.5 w-3.5 text-primary shrink-0" />
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem class="cursor-pointer gap-2 p-2" @click="closeMobileSheet(); isAddWorkspaceDialogOpen = true">
                        <Plus class="h-3.5 w-3.5" />
                        <span class="text-sm text-muted-foreground">Ajouter un workspace</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div class="space-y-0.5">
                  <Button @click="closeMobileSheet(); goToDashboardPage()" :variant="isCurrentPage('') ? 'secondary' : 'ghost'" class="w-full justify-start h-9 text-sm">
                    <LayoutDashboard class="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button @click="closeMobileSheet(); goToModelsPage()" :variant="isCurrentPage('models') ? 'secondary' : 'ghost'" class="w-full justify-start h-9 text-sm">
                    <PanelTopIcon class="mr-2 h-4 w-4" />
                    Modèles
                  </Button>
                  <Button @click="closeMobileSheet(); goToMembersPage()" :variant="isCurrentPage('members') ? 'secondary' : 'ghost'" class="w-full justify-start h-9 text-sm">
                    <UsersRound class="mr-2 h-4 w-4" />
                    Membres
                  </Button>
                  <Button v-if="getIsOwner" @click="closeMobileSheet(); goToSettingsPage()" :variant="isCurrentPage('settings') ? 'secondary' : 'ghost'" class="w-full justify-start h-9 text-sm">
                    <Settings2 class="mr-2 h-4 w-4" />
                    Paramètres
                  </Button>
                </div>

                <!-- Teams Mobile -->
                <div class="mt-5">
                  <div class="flex items-center justify-between px-2 mb-2">
                    <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Équipes</span>
                    <CreateTeamDialog />
                  </div>
                  <div class="space-y-0.5">
                    <NuxtLink
                      v-for="team in selectedWorkspace?.teams" :key="team.id"
                      :to="goToThisWorkspaceUrl('team/'+ team.id)"
                      @click="closeMobileSheet()"
                      class="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors hover:bg-accent/50"
                    >
                      <div class="w-2.5 h-2.5 rounded-full" :class="teamColorClass(team?.color)"></div>
                      <span class="truncate font-medium">{{ team.name }}</span>
                    </NuxtLink>
                  </div>
                </div>
              </nav>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <!-- Page title (centered) -->
        <div class="absolute left-1/2 -translate-x-1/2 hidden md:block">
          <h1 class="text-sm font-medium text-foreground truncate">{{ currentPageTitle }}</h1>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <!-- Invite button -->
          <InviteMembersDialog v-model:open="isInviteDialogOpen" />
          <Button
            size="icon"
            variant="ghost"
            class="md:hidden h-8 w-8"
            @click="isInviteDialogOpen = true"
          >
            <UserRoundPlus class="w-4 h-4" />
          </Button>

          <!-- User dropdown -->
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" class="relative h-8 w-8 rounded-full">
                <Avatar class="h-8 w-8">
                  {{ data?.user?.name?.charAt(0).toUpperCase() }}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-56" align="end">
              <DropdownMenuLabel class="font-normal">
                <div class="flex flex-col space-y-1">
                  <p class="text-sm font-medium leading-none">{{ data?.user?.name }}</p>
                  <p class="text-xs leading-none text-muted-foreground">{{ data?.user?.email }}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem class="cursor-pointer">
                  <UserIcon class="mr-2 h-4 w-4" />
                  <span>Mon compte</span>
                </DropdownMenuItem>
                <DropdownMenuItem class="cursor-pointer">
                  <CreditCardIcon class="mr-2 h-4 w-4" />
                  <span>Facturation</span>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Languages class="mr-2 h-4 w-4" />
                    <span>Langue</span>
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
              <DropdownMenuItem class="cursor-pointer text-destructive focus:text-destructive" @click="signOut">
                <LogOutIcon class="mr-2 h-4 w-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <!-- Main Content -->
      <main class="flex-1 overflow-auto">
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

import {ref, computed} from 'vue';
import {useWorkspace} from '@/composables/api/useWorkspace';
import {useTeam} from '@/composables/api/useTeam';
import WorkspacesSidebar from '@/components/WorkspacesSidebar.vue'
import AddWorkspaceDialog from '@/components/workspace/AddWorkspaceDialog.vue'
import CreateTeamDialog from '@/components/teams/CreateTeamDialog.vue'
import InviteMembersDialog from '@/components/workspace/InviteMembersDialog.vue'
import ManageTeamDialog from '@/components/teams/ManageTeamDialog.vue'
import { teamColorClass } from "~/utils";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item'

import {
  Check,
  ChevronsUpDown,
  CreditCardIcon,
  Languages,
  LayoutDashboard,
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
import {toast} from 'vue-sonner';
import {z} from "zod/v4";
import {authClient, useSession} from '~/lib/auth-client';
import {NuxtLink} from '#components';



const route = useRoute()
const { data } = await useSession(useFetch);

const currentPageTitle = computed(() => {
  const segments = route.path.split('/')
  const page = segments.pop()
  // Check if we're on a team page
  if (segments[segments.length - 1] === 'team') {
    const team = selectedWorkspace.value?.teams?.find(t => t.id === page)
    return team?.name || 'Équipe'
  }
  const titles: Record<string, string> = {
    dashboard: 'Dashboard',
    models: 'Modèles',
    members: 'Membres',
    settings: 'Paramètres',
  }
  // If page matches a workspaceId (index page), it's the dashboard
  if (page === route.params.workspaceId) return 'Dashboard'
  return titles[page || ''] || selectedWorkspace.value?.name || ''
})

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

const goToDashboardPage = async () => {
  const url = goToThisWorkspaceUrl('')
  await navigateTo(url)
}

const goToModelsPage = async () => {
  const url = goToThisWorkspaceUrl('models')
  await navigateTo(url)
}

const goToSettingsPage = async () => {
  const url = goToThisWorkspaceUrl('settings')
  await navigateTo(url)
}

const isCurrentPage = (page: string) => {
  const path = route.path.replace(/\/$/, '') // Remove trailing slash
  if (page === '') {
    // Dashboard = index page of the workspace
    const workspaceBase = goToThisWorkspaceUrl('')
    return path === workspaceBase
  }
  return path.endsWith(`/${page}`)
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