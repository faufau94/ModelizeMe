<script lang="ts" setup>
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-vue-next';
import DropFile from "@/components/flow/DropFile.vue";

import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog'

const props = defineProps<{
  importItems?: Array<{ title: string; disabled?: boolean; isComingSoon?: boolean }>;
  exportItems?: Array<{ title: string; action: () => void; disabled?: boolean }>;
}>();

const isOpen = ref(false);
const toggleDialog = () => isOpen.value = !isOpen.value;


</script>

<template>
  <Dialog v-model:open="isOpen">

  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class=" border-none rounded-sm">
        <Download :size="18"/>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-56">
      <DropdownMenuLabel>Importer / Exporter</DropdownMenuLabel>
      <DropdownMenuSeparator/>
      <DropdownMenuSub v-if="importItems && importItems.length > 0">
        <DropdownMenuSubTrigger>
          <span>Importer</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              v-for="(item, index) in importItems"
              :key="index"
              :class="{ 'opacity-25': item.disabled }"
            >
              <DialogTrigger v-if="!item.disabled">
                {{ item.title }}
              </DialogTrigger>
              <span v-else>{{ item.title }}</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
      <DropdownMenuSub v-if="exportItems && exportItems.length > 0">
        <DropdownMenuSubTrigger>
          <span>Exporter</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              v-for="(item, index) in exportItems"
              :key="index"
              @click="item.action"
              :disabled="item.disabled"
            >
              <span>{{ item.title }}</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </DropdownMenuContent>
  </DropdownMenu>
    <DropFile menu-item="Importer un fichier" @toggle-dialog="toggleDialog" />

  </Dialog>

</template>


