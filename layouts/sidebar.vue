<template>
  <div class="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
    <div class="hidden border-r bg-muted/40 md:block" :class="sidebarClass">
      <div class="flex h-full max-h-screen flex-col gap-2">
        <div class="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <NuxtLink to="/" class="flex items-center gap-2 font-semibold">
            <!--
            <Package2 class="h-6 w-6" />
            -->
            <span class="">ModelizeMe</span>
          </NuxtLink>
          <!--
          <Button @click="toggleSidebar" variant="ghost" size="icon" class="ml-auto h-8 w-8">
            <ChevronsLeft v-if="isExpanded" class="h-4 w-4" />
            <ChevronsRight v-else class="h-4 w-4" />
            <span class="sr-only">Notifications</span>
          </Button>
          -->
        </div>
        <div class="flex-1">
          <nav class="grid items-start px-2 text-sm font-medium lg:px-4">
            <!--
            <NuxtLink
                to="/app/dashboard"
                class="flex items-center gap-3 rounded-lg px-3 py-3 transition-all hover:text-primary"
                :class="[route.path === '/app/dashboard' ? 'text-primary bg-muted': 'text-muted-foreground']"
            >
              <Gauge class="h-4 w-4" />
              Tableau de bord
            </NuxtLink>
            -->
            <NuxtLink
                to="/app"
                class="flex items-center gap-3 rounded-lg px-3 py-3 transition-all hover:text-primary"
                :class="[route.path === '/app' ? 'text-primary bg-muted': 'text-muted-foreground']"
            >
              <Ungroup class="h-4 w-4" />
              Modèles
            </NuxtLink>
            <NuxtLink
                to="/app/code-generator"
                class="flex items-center gap-3 rounded-lg px-3 py-3 transition-all hover:text-primary"
                :class="[route.path === '/app/code-generator' ? 'text-primary bg-muted': 'text-muted-foreground']"
            >
              <CodeXml class="h-4 w-4" />
              Générateur de code
            </NuxtLink>
            <NuxtLink
                href="#"
                class="flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary"
            >
              <Users class="h-4 w-4" />
              Equipe
            </NuxtLink>
            <NuxtLink
                href="#"
                class="flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary"
            >
              <GalleryHorizontalEnd class="h-4 w-4" />
              Galerie
            </NuxtLink>
            <NuxtLink
                href="#"
                class="flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary"
            >
              <Bolt class="h-4 w-4" />
              Paramètre
            </NuxtLink>
          </nav>
        </div>
        <div class="mt-auto p-4 space-y-3">
          <Card>
            <CardHeader class="p-2 pt-0 md:p-4">
              <CardTitle class="text-xl">Upgrade to Pro</CardTitle>
              <CardDescription>
                Unlock all features and get unlimited access to our support
                team.
              </CardDescription>
            </CardHeader>
            <CardContent class="p-2 pt-0 md:p-4 md:pt-0">
              <Button size="sm" class="w-full">
                Upgrade
              </Button>
            </CardContent>
          </Card>

          <client-only>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="secondary" size="icon" class="rounded-full">
                <CircleUser class="h-5 w-5" />
                <span class="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Paramètres</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <NuxtLink class="cursor-pointer" @click.prevent="() => signOut({ callbackUrl: '/' })">
                  Se déconnecter
                </NuxtLink>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </client-only>
        </div>
      </div>
    </div>
    <div class="flex flex-col p-4">
      <div class="flex px-4 justify-between items-center">
        <NuxtLink to="/" class="flex items-center gap-2 font-semibold md:hidden">
          <!--
          <Package2 class="h-6 w-6" />
          -->
          <span class="">ModelizeMe</span>
        </NuxtLink>
        <Sheet>
          <SheetTrigger as-child>
            <Button
                variant="outline"
                size="icon"
                class="shrink-0 md:hidden"
            >
              <Menu class="h-5 w-5" />
              <span class="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" class="flex flex-col">
            <nav class="grid gap-2 text-lg font-medium">
              <NuxtLink
                  href="#"
                  class="flex items-center gap-2 text-lg font-semibold"
              >
                <!--
                <Package2 class="h-6 w-6" />
                -->
                <span class="sr-only">ModelizMe</span>
              </NuxtLink>
              <!--
              <NuxtLink
                  to="/app/dashboard"
                  class="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-3 hover:text-foreground"
                  :class="[route.path === '/app/dashboard' ? 'text-primary bg-muted': 'text-muted-foreground']"
              >
                <Gauge class="h-5 w-5" />
                Tableau de bord
              </NuxtLink>
              -->
              <NuxtLink
                  to="/app"
                  class="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-3 text-foreground hover:text-foreground"
                  :class="[route.path === '/app' ? 'text-primary bg-muted': 'text-muted-foreground']"
              >
                <Ungroup class="h-5 w-5" />
                Modèles
              </NuxtLink>
              <NuxtLink
                  to="/app/code-generator"
                  class="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-3 hover:text-foreground"
                  :class="[route.path === '/app/code-generator' ? 'text-primary bg-muted': 'text-muted-foreground']"
              >
                <CodeXml class="h-5 w-5" />
                Générateur de code
              </NuxtLink>
              <NuxtLink
                  href="#"
                  class="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-3 text-muted-foreground hover:text-foreground"
              >
                <Users class="h-5 w-5" />
                Equipe
              </NuxtLink>
              <NuxtLink
                  href="#"
                  class="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-3 text-muted-foreground hover:text-foreground"
              >
                <GalleryHorizontalEnd class="h-5 w-5" />
                Galerie
              </NuxtLink>
              <NuxtLink
                  href="#"
                  class="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-3 text-muted-foreground hover:text-foreground"
              >
                <Bolt class="h-5 w-5" />
                Paramètre
              </NuxtLink>
            </nav>
            <div class="mt-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upgrade to Pro</CardTitle>
                  <CardDescription>
                    Unlock all features and get unlimited access to our
                    support team.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" class="w-full">
                    Upgrade
                  </Button>
                </CardContent>
              </Card>

              <client-only>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="secondary" size="icon" class="rounded-full">
                    <CircleUser class="h-5 w-5" />
                    <span class="sr-only">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Paramètres</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <NuxtLink class="cursor-pointer" @click.prevent="() => signOut({ callbackUrl: '/' })">
                      Se déconnecter
                    </NuxtLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </client-only>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <main>
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from "vue";
import {Bolt, CircleUser, CodeXml, GalleryHorizontalEnd, Gauge, Menu, Search, Ungroup, Users} from 'lucide-vue-next'

import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {Input} from '@/components/ui/input'
import {Sheet, SheetContent, SheetTrigger} from '@/components/ui/sheet'

const route = useRoute()

const isExpanded = ref(true);
const sidebarClass = computed(() => (isExpanded.value ? "w-62" : "w-16"));
const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value;
};

const {signOut} = useAuth()
</script>

<!-- Sidebar principale
    <div :class="sidebarClass"
         class="relative flex flex-col justify-between border-e bg-white transition-all duration-300">
      <div class="px-4 py-6" v-if="isExpanded">
        <div class="grid h-10 w-32 place-content-center rounded-lg bg-gray-100 text-xs text-gray-600">
          Logo
        </div>
        <ul class="mt-6 space-y-1">
          <li>
            <a href="#" class="block rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
              Modèles
            </a>
          </li>
          <li>
            <a href="#"
               class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700">
              Générateur de code
            </a>
          </li>
          <li>
            <a href="#"
               class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700">
              Galerie
            </a>
          </li>
          <li>
            <a href="#"
               class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700">
              Paramètres
            </a>
          </li>
          <li>
            <NuxtLink @click="() => signOut({ callbackUrl: '/' })"
               class="cursor-pointer block rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700">
              Se déconnecter
            </NuxtLink>
          </li>
        </ul>
      </div>
      <div v-else>
        <div class="inline-flex size-16 items-center justify-center">
          <span class="grid size-10 place-content-center rounded-lg bg-gray-100 text-xs text-gray-600">
            L
          </span>
        </div>
        <div class="border-t border-gray-100">
          <div class="px-2">
            <div class="py-4">
              <a href="#" class="group relative flex justify-center rounded bg-blue-50 px-2 py-1.5 text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="size-5 opacity-75" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span
                    class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
                  Modèles
                </span>
              </a>
            </div>
            <ul class="space-y-1 border-t border-gray-100 pt-4">
              <li>
                <a href="#"
                   class="group relative flex justify-center rounded px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-5 opacity-75" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                  <span
                      class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
                    Galerie
                  </span>
                </a>
              </li>
            </ul>
            <ul class="space-y-1 border-t border-gray-100 pt-4">
              <li>
                <a href="#"
                   class="group relative flex justify-center rounded px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-5 opacity-75" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                  <span
                      class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
                    Générateur de codes
                  </span>
                </a>
              </li>
            </ul>
            <ul class="space-y-1 border-t border-gray-100 pt-4">
              <li>
                <a href="#"
                   class="group relative flex justify-center rounded px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-5 opacity-75" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                  <span
                      class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
                    Paramètres
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <button @click="toggleSidebar"
              class="absolute z-50 top-4 right-0 bg-gray-200 hover:bg-gray-300 transition-all duration-300 translate-x-6 rounded">
        <svg v-if="isExpanded" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"
             class="lucide lucide-chevrons-left">
          <path d="m11 17-5-5 5-5"/>
          <path d="m18 17-5-5 5-5"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"
             class="lucide lucide-chevrons-right">
          <path d="m6 17 5-5-5-5"/>
          <path d="m13 17 5-5-5-5"/>
        </svg>
      </button>
    </div>
-->
