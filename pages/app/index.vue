<template>
  <div class="flex h-screen w-full bg-background">
    <!-- Organization Sidebar -->
    <div class="w-16 border-r border-border bg-card flex flex-col items-center hidden md:flex">
      <div class="flex flex-col items-center space-y-4">
        <!-- Organization Logo -->
        
        <!-- Organization Selector - No Popover -->
        <div class="flex flex-col items-center space-y-3 mt-4">
          <!-- Simple button without dropdown -->
          <template v-for="workspace in workspaces" :key="workspace.id">
            <Button @click="selectedWorkspaceId = workspace.id" variant="outline" size="icon" 
            class="h-8 w-8 rounded-md"
            :class="selectedWorkspaceId && selectedWorkspaceId === workspace?.id ? 'ring-2 ring-primary ring-offset-2' : ''">
              <span class="font-medium text-xs"> {{ workspace?.name?.charAt(0).toLocaleUpperCase() }}</span>
            </Button>
          </template>
        </div>
        
        <!-- Add Organization Button -->
        <AddWorkspaceDialog :isOnlyIcon="true"/>
      </div>
    </div>
    
    <!-- Navigation Sidebar -->
    <div class="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
      <!-- Logo -->
      <div class="flex justify-center py-4">
        <div class="h-10 w-10 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
          <CodeIcon class="h-6 w-6" />
        </div>
      </div>
      
      <!-- Team Switcher -->
      <div class="px-4 py-2">
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
                        <PlusCircledIcon class="mr-2 h-5 w-5" />
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
      </div>
      
      <!-- Navigation Menu -->
      <ScrollArea class="flex-1">
        <nav class="py-3">
          <div class="px-3 mb-2">
            <div class="space-y-1">
              <Button variant="ghost" class="w-full justify-start" asChild>
                <a href="#" class="font-medium text-primary">
                  <PanelTopIcon class="mr-2 h-4 w-4" />
                  Modèles
                </a>
              </Button>
              <Button variant="ghost" class="w-full justify-start">
                <UsersRound class="mr-2 h-4 w-4" />
                Membres
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
          <div class="h-10 w-10 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
            <CodeIcon class="h-6 w-6" />
          </div>
        </div>
        
        <!-- Team Switcher for Mobile -->
        <div class="px-4 py-2">
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
                          <PlusCircledIcon class="mr-2 h-5 w-5" />
                          Créer une équipe
                        </CommandItem>
                      </DialogTrigger>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </Dialog>
        </div>
        
        <!-- Mobile Navigation Menu -->
        <ScrollArea class="h-[calc(100vh-8.5rem)]">
          <nav class="py-3">
            <div class="px-3 mb-2">
              <div class="space-y-1">
                <Button variant="ghost" class="w-full justify-start" asChild>
                  <a href="#" class="font-medium text-primary">
                    <PanelTopIcon class="mr-2 h-4 w-4" />
                    Modèles
                  </a>
                </Button>
                <Button variant="ghost" class="w-full justify-start">
                  <UsersRound class="mr-2 h-4 w-4" />
                  Membres
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
        <h1 class="text-lg font-semibold text-foreground md:ml-0 ml-12">Vue d'ensemble</h1>
        <div class="ml-auto flex items-center space-x-4">

          <!-- language switcher -->
          <Select>
            <SelectTrigger >
              <SelectIcon asChild>
                <Globe class="h-4 w-4" />
              </SelectIcon>
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="english">
                  English
                </SelectItem>
                <SelectItem value="French">
                  French
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>


          <Button variant="ghost" size="icon">
            <BellIcon class="h-5 w-5" />
          </Button>
          
          <!-- User Account Dropdown (Updated) -->
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" class="relative h-8 w-8 rounded-full">
                <Avatar class="h-8 w-8">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-56" align="end">
              <DropdownMenuLabel class="font-normal">
                <div class="flex flex-col space-y-1">
                  <p class="text-sm font-medium leading-none">shadcn</p>
                  <p class="text-xs leading-none text-muted-foreground">m@example.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  Profil
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Facturation
                  <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Paramètres
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>Nouvelle équipe</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Déconnexion
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <!-- New Main Content -->
      <main>
        <div class="w-full max-w-6xl mx-auto px-4 py-8">
          <div v-if="isLoadingPage" class="flex justify-center mt-32 items-center">
            <Loader2 :size="30" class="animate-spin"/>
          </div>
          <div v-else>
            <div v-if="areModelsLoaded === true && (models === null || models.length === 0)">
              <div class="flex flex-col items-center justify-center h-[80vh]">
                <div class="text-center space-y-4">
                  <h3 class="text-2xl font-bold">Aucun modèle</h3>
                  <p class="text-muted-foreground">Vous n'avez encore pas créé de modèles.</p>
                  <CreateModelDialog/>
                </div>
              </div>
            </div>
            <div v-else>
              <div class="flex items-center justify-between mb-6">
                <h1 class="text-2xl font-bold">Modèles</h1>
                <CreateModelDialog/>
              </div>
              <div class="mb-6">
                <div class="relative w-full max-w-sm items-center">
                  <Input v-model="searchTerm" id="search" type="text" placeholder="Rechercher un modèle" class="pl-10"/>
                  <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                    <Search class="size-5 text-muted-foreground"/>
                  </span>
                </div>
              </div>
              <div v-if="isLoading" class="flex justify-center mt-32 items-center">
                <Loader2 :size="30" class="animate-spin"/>
              </div>
              <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CardModel v-for="(model, index) in filteredModels" :key="index" :model="model"/>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h, Suspense } from 'vue'
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
  Globe
} from 'lucide-vue-next'

// Import shadcn-vue components
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
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

import CardModel from "@/components/ui/card/CardModel.vue"
import CreateModelDialog from "@/components/flow/CreateModelDialog.vue"
import { storeToRefs } from "pinia"
import { useMCDStore } from "@/stores/mcd-store.js"
import { useWorkspaceStore } from "@/stores/admin/workspace-store.ts"
import AddWorkspaceDialog from '@/components/workspace/AddWorkspaceDialog.vue'

// Mock data for team switcher
const groups = [
  {
    label: 'Compte Personnel',
    teams: [
      {
        label: 'Alicia Koch',
        value: 'personal',
      },
    ],
  },
  {
    label: 'Équipes',
    teams: [
      {
        label: 'Acme Inc.',
        value: 'acme-inc',
      },
      {
        label: 'Monsters Inc.',
        value: 'monsters',
      },
    ],
  },
]


const teamSwitcherOpen = ref(false)
const showNewTeamDialog = ref(false)
const selectedTeam = ref(groups[1].teams[0])

// For PlusCircledIcon
const PlusCircledIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 15 15',
      fill: 'none',
      width: '1em',
      height: '1em'
    }, [
      h('path', {
        d: 'M7.5 0.875C3.83152 0.875 0.875 3.83152 0.875 7.5C0.875 11.1685 3.83152 14.125 7.5 14.125C11.1685 14.125 14.125 11.1685 14.125 7.5C14.125 3.83152 11.1685 0.875 7.5 0.875ZM7.5 1.825C10.6428 1.825 13.175 4.35719 13.175 7.5C13.175 10.6428 10.6428 13.175 7.5 13.175C4.35719 13.175 1.825 10.6428 1.825 7.5C1.825 4.35719 4.35719 1.825 7.5 1.825ZM7.5 4.25C7.22386 4.25 7 4.47386 7 4.75V7H4.75C4.47386 7 4.25 7.22386 4.25 7.5C4.25 7.77614 4.47386 8 4.75 8H7V10.25C7 10.5261 7.22386 10.75 7.5 10.75C7.77614 10.75 8 10.5261 8 10.25V8H10.25C10.5261 8 10.75 7.77614 10.75 7.5C10.75 7.22386 10.5261 7 10.25 7H8V4.75C8 4.47386 7.77614 4.25 7.5 4.25Z',
        fill: 'currentColor'
      })
    ])
  }
}

// Model data and state
const mcdStore = useMCDStore()
const { models } = storeToRefs(mcdStore)

const workspaceStore = useWorkspaceStore()
const { workspaces, selectedWorkspaceId } = storeToRefs(workspaceStore)

const isLoading = ref(false)
const areModelsLoaded = ref(false)
const isLoadingPage = ref(true)


onMounted(async () => {
  isLoadingPage.value = false
  isLoading.value = true

  try {
    //models.value = await fetch('/api/models/list', {method: 'GET'}).then(res => res.json())
  } catch (error) {
    console.error('Error fetching models:', error)
    models.value = []
  }
  isLoading.value = false
  areModelsLoaded.value = true
})

const searchTerm = ref("")

const filteredModels = computed(() => {
  if (!models.value) return []
  if (searchTerm.value === "") return models.value
  return models.value.filter((card) =>
    card.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})
</script>