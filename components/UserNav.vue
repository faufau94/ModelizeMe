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
        <DropdownMenuItem>
          Profil
        </DropdownMenuItem>
        <DropdownMenuItem>
          Facturation
        </DropdownMenuItem>
        <DropdownMenuItem>
          Paramètres
        </DropdownMenuItem>
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
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { signOut, useSession } from '~/lib/auth-client';
const { data } = await useSession(useFetch);

</script>
