<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="relative h-8 w-8 rounded-full">
        <Avatar class="h-9 w-9">
          <AvatarFallback>{{ data?.user?.name?.charAt(0).toUpperCase() }}</AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-56" align="end">
      <DropdownMenuLabel class="font-normal flex">
        <div class="flex flex-col space-y-1">
          <p class="text-sm font-medium leading-none">
            {{ data?.user?.name }}
          </p>
          <p class="text-xs leading-none text-muted-foreground">
            {{ data?.user?.email }}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem class="cursor-pointer" @click="navigateTo('/app/profile')">
          Mon compte
        </DropdownMenuItem>
        <DropdownMenuItem>
          Facturation
        </DropdownMenuItem>
        <div class="flex items-center justify-between px-2 py-1.5 text-sm">
          <span>Thème</span>
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
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <NuxtLink class="cursor-pointer" @click.prevent="async () => {
                    await signOut()
                    await navigateTo('/')
                }">
          Se déconnecter
        </NuxtLink>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Monitor, Moon, Sun } from 'lucide-vue-next'

import { signOut, useSession } from '~/lib/auth-client';
const { data } = await useSession(useFetch);

const { colorMode, setTheme } = useThemeTransition();

const themeOptions = [
  { value: 'system', icon: Monitor },
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
];

</script>
