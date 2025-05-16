<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { computed } from 'vue'

import { labels } from '@/components/dataTable/data/data'
import { userSchema } from '@/components/dataTable/data/schema'
import { Ellipsis } from 'lucide-vue-next'

 interface Action<T> {
  label: string,
  onClick: (row: Row<T>) => void
  class?: string,
}

interface DataTableRowActionsProps<T> {
  row: Row<T>
  actions: Action<T>[]
}

const props = defineProps<DataTableRowActionsProps<any>>()


</script>

<template>
  <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <Ellipsis class="h-4 w-4" />
          <span class="sr-only">Ouvrir le menu d’actions</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" class="w-40">
        <template v-for="action in props.actions" :key="action.label">
          <DropdownMenuItem class="cursor-pointer" :class="props.class ?? ''" @click="action.onClick(props.row)">
            {{ action.label }}
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenu>
</template>
