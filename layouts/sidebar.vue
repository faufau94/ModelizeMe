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
      
      <!-- Team Switcher -->
      <!-- <div class="px-4 py-2">
        <Dialog v-model:open="showNewTeamDialog">
          <Popover v-model:open="teamSwitcherOpen">
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                :aria-expanded="teamSwitcherOpen"
                aria-label="Sélectionner une équipe"
                class="w-full justify-between"
              >
                <Avatar class="mr-2 h-5 w-5">
                  <AvatarImage
                    :src="`https://avatar.vercel.sh/${selectedTeam.value}.png`"
                    :alt="selectedTeam.label"
                  />
                  <AvatarFallback>{{ selectedTeam.label.charAt(0) }}</AvatarFallback>
                </Avatar>
                {{ selectedTeam.label }}
                <ChevronDownIcon class="ml-auto h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-full p-0">
              <Command>
                <CommandList>
                  <CommandInput placeholder="Rechercher une équipe..." />
                  <CommandEmpty>Aucune équipe trouvée.</CommandEmpty>
                  <CommandGroup v-for="group in groups" :key="group.label" :heading="group.label">
                    <CommandItem
                      v-for="team in group.teams"
                      :key="team.value"
                      class="text-sm"
                      @click="() => {
                        selectedTeam = team;
                        teamSwitcherOpen = false;
                      }"
                    >
                      <Avatar class="mr-2 h-5 w-5">
                        <AvatarImage
                          :src="`https://avatar.vercel.sh/${team.value}.png`"
                          :alt="team.label"
                        />
                        <AvatarFallback>{{ team.label.charAt(0) }}</AvatarFallback>
                      </Avatar>
                      {{ team.label }}
                      <CheckIcon
                        class="ml-auto h-4 w-4"
                        :class="selectedTeam.value === team.value ? 'opacity-100' : 'opacity-0'"
                      />
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
                <CommandSeparator />
                <CommandList>
                  <CommandGroup>
                    <DialogTrigger asChild>
                      <CommandItem
                        @click="() => {
                          teamSwitcherOpen = false;
                          showNewTeamDialog = true;
                        }"
                      >
                        <Plus class="mr-2 h-5 w-5" />
                        Créer une équipe
                      </CommandItem>
                    </DialogTrigger>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une équipe</DialogTitle>
              <DialogDescription>
                Ajoutez une nouvelle équipe pour gérer les produits et les clients.
              </DialogDescription>
            </DialogHeader>
            <div>
              <div class="space-y-4 py-2 pb-4">
                <div class="space-y-2">
                  <Label for="name">Nom de l'équipe</Label>
                  <Input id="name" placeholder="Acme Inc." />
                </div>
                <div class="space-y-2">
                  <Label for="plan">Plan d'abonnement</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">
                        <span class="font-medium">Gratuit</span> -
                        <span class="text-muted-foreground">
                          Essai de deux semaines
                        </span>
                      </SelectItem>
                      <SelectItem value="pro">
                        <span class="font-medium">Pro</span> -
                        <span class="text-muted-foreground">
                          9€/mois par utilisateur
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" @click="showNewTeamDialog = false">
                Annuler
              </Button>
              <Button type="submit">
                Continuer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div> -->
      
      <!-- Navigation Menu -->
      <ScrollArea class="flex-1">
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
              <CreateTeamDialog />
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
              
              <!-- Team 4 - Separate Button and Dropdown -->
              <div class="flex items-center">
                <Button variant="ghost" class="flex-1 justify-start" asChild>
                  <a href="#">Équipe 4</a>
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
        
        <!-- Team Switcher for Mobile -->
        <!-- <div class="px-4 py-2">
          <Dialog v-model:open="showNewTeamDialog">
            <Popover v-model:open="teamSwitcherOpen">
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  :aria-expanded="teamSwitcherOpen"
                  aria-label="Sélectionner une équipe"
                  class="w-full justify-between"
                >
                  <Avatar class="mr-2 h-5 w-5">
                    <AvatarImage
                      :src="`https://avatar.vercel.sh/${selectedTeam.value}.png`"
                      :alt="selectedTeam.label"
                    />
                    <AvatarFallback>{{ selectedTeam.label.charAt(0) }}</AvatarFallback>
                  </Avatar>
                  {{ selectedTeam.label }}
                  <ChevronDownIcon class="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-full p-0">
                <Command>
                  <CommandList>
                    <CommandInput placeholder="Rechercher une équipe..." />
                    <CommandEmpty>Aucune équipe trouvée.</CommandEmpty>
                    <CommandGroup v-for="group in groups" :key="group.label" :heading="group.label">
                      <CommandItem
                        v-for="team in group.teams"
                        :key="team.value"
                        class="text-sm"
                        @click="() => {
                          selectedTeam = team;
                          teamSwitcherOpen = false;
                        }"
                      >
                        <Avatar class="mr-2 h-5 w-5">
                          <AvatarImage
                            :src="`https://avatar.vercel.sh/${team.value}.png`"
                            :alt="team.label"
                          />
                          <AvatarFallback>{{ team.label.charAt(0) }}</AvatarFallback>
                        </Avatar>
                        {{ team.label }}
                        <CheckIcon
                          class="ml-auto h-4 w-4"
                          :class="selectedTeam.value === team.value ? 'opacity-100' : 'opacity-0'"
                        />
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                  <CommandSeparator />
                  <CommandList>
                    <CommandGroup>
                      <DialogTrigger asChild>
                        <CommandItem
                          @click="() => {
                            teamSwitcherOpen = false;
                            showNewTeamDialog = true;
                          }"
                        >
                          <Plus class="mr-2 h-5 w-5" />
                          Créer une équipe
                        </CommandItem>
                      </DialogTrigger>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </Dialog>
        </div> -->
        
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

            <Button
            @click="copyLink"
            variant="outline"
            size="sm"
            class="hidden md:flex items-center gap-2 transition-colors"
            :disabled="copiedWorkspaceLink"
            aria-live="polite"
            >
            <template v-if="copiedWorkspaceLink">
              <CheckIcon class="w-4 h-4 text-primary" />
              <span>Lien copié !</span>
            </template>
            <template v-else>
              <Share2 class="w-4 h-4" />
              <span>Partager l'espace de travail</span>
            </template>

            </Button>


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


          <!-- <Button variant="ghost" size="icon">
            <BellIcon class="h-5 w-5" />
          </Button> -->

          <!-- User Account Dropdown (Updated) -->
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" class="relative h-8 w-8 rounded-full">
                <Avatar class="h-8 w-8">
                  {{ data?.user?.first_name?.charAt(0).toUpperCase() + data?.user?.name?.charAt(0).toUpperCase()  }}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-56" align="end">
              <DropdownMenuLabel class="font-normal">
                <div class="flex flex-col space-y-1">
                  <p class="text-sm font-medium leading-none">
                    {{ data?.user?.first_name + ' ' + data?.user?.name  }}
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
                <NuxtLink class="cursor-pointer" @click.prevent="() => signOut({ callbackUrl: '/' })">
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
import { useWorkspaceStore } from '@/stores/api/workspace-store';
import { storeToRefs } from "pinia"
import WorkspacesSidebar from '@/components/WorkspacesSidebar.vue'
import AddWorkspaceDialog from '@/components/workspace/AddWorkspaceDialog.vue'
import CreateTeamDialog from '@/components/teams/CreateTeamDialog.vue';


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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'

const route = useRoute()
const { data } = useAuth()



// Mock data for team switcher
// const groups = [
//   {
//     label: 'Compte Personnel',
//     teams: [
//       {
//         label: 'Alicia Koch',
//         value: 'personal',
//       },
//     ],
//   },
//   {
//     label: 'Équipes',
//     teams: [
//       {
//         label: 'Acme Inc.',
//         value: 'acme-inc',
//       },
//       {
//         label: 'Monsters Inc.',
//         value: 'monsters',
//       },
//     ],
//   },
// ]

const { signOut } = useAuth()
// const teamSwitcherOpen = ref(false)
// const showNewTeamDialog = ref(false)
// const selectedTeam = ref(groups[1].teams[0])
const copiedWorkspaceLink = ref(false)

const { selectedWorkspace, copyWorkspaceLink, goToThisWorkspaceUrl } = useWorkspace()

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

</script>