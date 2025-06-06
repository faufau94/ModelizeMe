<script lang="ts" setup>
import { ref } from 'vue';
import { useVueFlow } from '@vue-flow/core';
import { useScreenshot } from '@/composables/useScreenshot';
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

const props = defineProps({
  vueFlowRef: Element,
  modelName: String,
});

const isOpen = ref(false);
const toggleDialog = () => isOpen.value = !isOpen.value;
const { exportAsImage } = useScreenshot();

const handleExport = (type) => {
  // Accéder directement à l'élément DOM contenant le diagramme
  const flowElement = props.vueFlowRef;

  if (flowElement) {
    exportAsImage(props.vueFlowRef, type, props.modelName);
  } else {
    console.warn('Current flow element not found');
  }
}
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
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <span>Importer</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuItem>
              <DialogTrigger>
                Importer un fichier XML
              </DialogTrigger>
            </DropdownMenuItem>
            <DropdownMenuItem class="opacity-25">
              <DialogTrigger>
                Importer un fichier SQL (coming soon...)
              </DialogTrigger>
            </DropdownMenuItem>
            <DropdownMenuItem class="opacity-25">
              <span>Importer un fichier JSON (coming soon...)</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <span>Exporter</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuItem @click="handleExport('png')">
              <span>Exporter en PNG</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleExport('jpeg')">
              <span>Exporter en JPEG</span>
            </DropdownMenuItem>
<!--            <DropdownMenuItem @click="handleExport('svg')">-->
<!--              <span>Exporter en SVG</span>-->
<!--            </DropdownMenuItem>-->
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </DropdownMenuContent>
  </DropdownMenu>
    <DropFile menu-item="Importer un fichier" @toggle-dialog="toggleDialog" />

  </Dialog>

</template>
