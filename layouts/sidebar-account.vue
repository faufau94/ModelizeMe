<template>
  <div class="flex h-screen w-full bg-background overflow-hidden">
    <!-- Account Sidebar (Desktop) -->
    <div
      class="border-r border-border/50 bg-muted/20 flex-col hidden md:flex transition-all duration-200"
      :class="isSidebarCollapsed ? 'w-14' : 'w-60'"
    >
      <!-- Back button -->
      <div class="h-14 flex items-center border-b border-border/50" :class="isSidebarCollapsed ? 'justify-center px-2' : 'px-4'">
        <TooltipProvider :delay-duration="300" :disable-hoverable-content="true">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                @click="goBack"
                class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft class="h-4 w-4 shrink-0" />
                <span v-if="!isSidebarCollapsed">Retour</span>
              </button>
            </TooltipTrigger>
            <TooltipContent v-if="isSidebarCollapsed" side="right">
              Retour
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-3" :class="isSidebarCollapsed ? 'px-1.5' : 'px-3'">
        <div class="space-y-0.5">
          <TooltipProvider :delay-duration="300" :disable-hoverable-content="true">
            <Tooltip v-for="item in accountNavItems" :key="item.page">
              <TooltipTrigger asChild>
                <button
                  @click="navigateTo(item.to)"
                  class="w-full flex items-center gap-2.5 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                  :class="[
                    item.isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground',
                    isSidebarCollapsed ? 'justify-center px-2' : 'px-2.5'
                  ]"
                >
                  <component :is="item.icon" class="h-4 w-4 shrink-0" />
                  <span v-if="!isSidebarCollapsed">{{ item.label }}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent v-if="isSidebarCollapsed" side="right">
                {{ item.label }}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </nav>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top bar -->
      <header class="h-14 px-6 flex items-center border-b border-border/50 shrink-0 relative">
        <!-- Collapse sidebar toggle -->
        <button
          @click="toggleSidebar()"
          class="hidden md:flex rounded-md text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground transition-colors cursor-pointer mr-2"
        >
          <PanelLeftClose v-if="!isSidebarCollapsed" class="h-4 w-4" />
          <PanelLeftOpen v-else class="h-4 w-4" />
        </button>

        <!-- Mobile menu trigger -->
        <Sheet v-model:open="isMobileSheetOpen">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" class="md:hidden mr-2 h-8 w-8">
              <MenuIcon class="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" class="w-72 p-0">
            <!-- Mobile nav content -->
            <div class="flex items-center gap-2.5 px-4 py-4 border-b border-border">
              <button
                @click="closeMobileSheet(); goBack()"
                class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft class="h-4 w-4" />
                <span>Retour</span>
              </button>
            </div>
            <ScrollArea class="h-[calc(100vh-8rem)]">
              <nav class="px-3 py-3">
                <div class="space-y-0.5">
                  <Button
                    v-for="item in accountNavItems"
                    :key="item.page"
                    @click="closeMobileSheet(); navigateTo(item.to)"
                    :variant="item.isActive ? 'secondary' : 'ghost'"
                    class="w-full justify-start h-9 text-sm"
                  >
                    <component :is="item.icon" class="mr-2 h-4 w-4" />
                    {{ item.label }}
                  </Button>
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
              <DropdownMenuLabel class="font-normal p-0">
                <button
                  @click="navigateTo('/app/profile')"
                  class="flex items-center justify-between w-full px-2 py-1.5 rounded-sm hover:bg-accent transition-colors cursor-pointer"
                >
                  <div class="flex flex-col space-y-1">
                    <p class="text-sm text-left font-medium leading-none">{{ data?.user?.name }}</p>
                    <p class="text-xs leading-none text-muted-foreground">{{ data?.user?.email }}</p>
                  </div>
                  <Settings2 class="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem class="cursor-pointer" @click="navigateTo('/app/feedback')">
                  <MessageCircleMore class="mr-2 h-4 w-4" />
                  <span>Feedback</span>
                </DropdownMenuItem>
                <div class="flex items-center justify-between px-2 py-1.5 text-sm">
                  <div class="flex items-center gap-2">
                    <SunMoon class="h-4 w-4" />
                    <span>Thème</span>
                  </div>
                  <div class="flex items-center gap-0.5 rounded-md border border-border p-0.5">
                    <button
                      v-for="option in themeOptions"
                      :key="option.value"
                      class="rounded p-1 transition-colors cursor-pointer"
                      :class="colorMode.preference === option.value
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground'"
                      @click="setTheme(option.value, $event)"
                    >
                      <component :is="option.icon" class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
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
              <DropdownMenuSeparator />
              <div class="px-1 py-1">
                <PricingDialog />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 overflow-auto">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  ArrowLeft,
  Check,
  CreditCard,
  Languages,
  LogOutIcon,
  MenuIcon,
  MessageCircleMore,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Sun,
  SunMoon,
  UserIcon,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
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
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu'
import { Avatar } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { authClient, useSession } from '~/lib/auth-client'
import PricingDialog from '@/components/PricingDialog.vue'

const route = useRoute()
const { data } = await useSession(useFetch)

const { colorMode, setTheme } = useThemeTransition()
const themeOptions = [
  { value: 'system', icon: Monitor },
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
]

const selectedLanguage = ref('French')
const isSidebarCollapsed = ref(false)
const isMobileSheetOpen = ref(false)

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const closeMobileSheet = () => {
  isMobileSheetOpen.value = false
}

const goBack = async () => {
  const activeOrgId = data.value?.session?.activeOrganizationId
  if (activeOrgId) {
    await navigateTo(`/app/workspace/${activeOrgId}`)
  } else {
    await navigateTo('/app')
  }
}

const accountNavItems = computed(() => [
  {
    page: 'profile',
    label: 'Profil',
    icon: UserIcon,
    to: '/app/profile',
    isActive: route.path === '/app/profile',
  },
  {
    page: 'billing',
    label: 'Facturation',
    icon: CreditCard,
    to: '/app/billing',
    isActive: route.path === '/app/billing',
  },
])

const currentPageTitle = computed(() => {
  const titles = {
    '/app/profile': 'Profil',
    '/app/billing': 'Facturation',
  }
  return titles[route.path] || 'Mon compte'
})

const signOut = async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        navigateTo('/', { replace: true, external: true })
      },
    },
  })
}
</script>
