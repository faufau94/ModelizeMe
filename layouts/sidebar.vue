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
                to="/app/generator"
                class="flex items-center gap-3 rounded-lg px-3 py-3 transition-all hover:text-primary"
                :class="[route.path === '/app/generator' ? 'text-primary bg-muted': 'text-muted-foreground']"
            >
              <CodeXml class="h-4 w-4" />
              Générateur de code
            </NuxtLink>
            <NuxtLink
                to="/app/team"
                class="flex items-center gap-3 rounded-lg px-3 py-3 transition-all hover:text-primary"
                :class="[route.path === '/app/team' ? 'text-primary bg-muted': 'text-muted-foreground']"
            >
              <Users class="h-4 w-4" />
              Equipe
            </NuxtLink>
            <NuxtLink
                href="/app/galery"
                class="flex items-center gap-3 rounded-lg px-3 py-3 transition-all hover:text-primary"
                :class="[route.path === '/app/galery' ? 'text-primary bg-muted': 'text-muted-foreground']"
            >
              <GalleryHorizontalEnd class="h-4 w-4" />
              Galerie
            </NuxtLink>
            <NuxtLink
                class="flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary opacity-50"
            >
              <Bolt class="h-4 w-4" />
              Paramètre (Coming soon...)
            </NuxtLink>
          </nav>
        </div>
        <div class="mt-auto p-4 space-y-3">
          <Card>
            <CardHeader class="p-2 pt-0 md:p-4">
              <CardTitle class="text-xl">Mettre à niveau</CardTitle>
              <CardDescription>
                Débloquez toutes les fonctionnalités.
              </CardDescription>
            </CardHeader>
            <CardContent class="p-2 pt-0 md:p-4 md:pt-0">
              <Button class="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-md px-4 py-2 inline-flex items-center">
                <Crown class="mr-2 h-4 w-4 text-yellow-400 fill-yellow-400"/>
                Mettre à niveau
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
    <div class="flex flex-col">
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
                  to="/app/generator"
                  class="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-3 hover:text-foreground"
                  :class="[route.path === '/app/generator' ? 'text-primary bg-muted': 'text-muted-foreground']"
              >
                <CodeXml class="h-5 w-5" />
                Générateur de code
              </NuxtLink>
              <NuxtLink
                  to="/app/team"
                  class="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-3 text-muted-foreground hover:text-foreground"
                  :class="[route.path === '/app/team' ? 'text-primary bg-muted': 'text-muted-foreground']"
              >
                <Users class="h-5 w-5" />
                Equipe
              </NuxtLink>
              <NuxtLink
                  to="/app/galery"
                  class="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-3 text-muted-foreground hover:text-foreground"
                  :class="[route.path === '/app/galery' ? 'text-primary bg-muted': 'text-muted-foreground']"
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
                <CardHeader class="p-2 pt-0 md:p-4">
                  <CardTitle class="text-xl">Mettre à niveau</CardTitle>
                  <CardDescription>
                    Débloquez toutes les fonctionnalités.
                  </CardDescription>
                </CardHeader>
                <CardContent class="p-2 pt-0 md:p-4 md:pt-0">
                  <Button class="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-md px-4 py-2 inline-flex items-center">
                    <Crown class="mr-2 h-4 w-4 text-yellow-400 fill-yellow-400"/>
                    Mettre à niveau
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
import {
  Bolt,
  CircleUser,
  CodeXml,
  Crown,
  GalleryHorizontalEnd,
  Gauge,
  Menu,
  Search,
  Ungroup,
  Users
} from 'lucide-vue-next'

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