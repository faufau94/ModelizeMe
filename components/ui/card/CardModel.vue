<template>
  <Card @click="openModel" class="cursor-pointer hover:border-gray-300 hover:shadow-md duration-150 transition">
    <CardHeader class="flex flex-row items-start gap-4 space-y-0">
      <div class="space-y-1 flex-1">
        <CardTitle class="text-lg">{{ props.model.name }}</CardTitle>
      </div>
      <div class="rounded-md text-secondary-foreground">

        <Toaster/>


        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button @click.stop="" variant="secondary" class="px-2 shadow-none bg-white">
              <EllipsisVertical :size="15" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
              align="end"
              :align-offset="-5"
              class="w-[200px]"
          >

            <DropdownMenuItem class="cursor-pointer">
              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <div @click.stop="showDialogRenameModel = true">
                    Renommer
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent v-if="showDialogRenameModel">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Renommer le nom</AlertDialogTitle>
                  </AlertDialogHeader>

                  <Input @keyup.enter="renameModel" v-model="model.name" type="text"/>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <Button @click="renameModel" :disabled="isRenamingModel">
                      <Loader2 v-if="isRenamingModel" class="w-4 h-4 mr-2 animate-spin"/>
                      {{ isRenamingModel ? 'Ajout...' : 'Ajouter' }}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuItem>
            <DropdownMenuItem class="cursor-pointer">
              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <div @click.stop="showDialogDeleteModel = true" class="text-red-500">
                    Supprimer
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent v-if="showDialogDeleteModel">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Voulez-vous supprimer ce modèle?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible et supprimera définitement ce modèle.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <Button @click.stop="deleteModel" :disabled="isLoading">
                      <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin"/>
                      {{ isLoading ? 'Suppression...' : 'Supprimer' }}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </CardHeader>
    <CardContent>
      <div class="flex gap-x-6 text-sm text-muted-foreground">
        <div class="flex items-center gap-x-2 justify-center">
          <PanelTop :size="15" />
          {{ props.model.nodes.length }} {{ props.model.nodes.length > 1 ? 'nœuds' : 'nœud' }}

        </div>
        <div class="flex items-center gap-x-2">
          <Workflow :size="15" />
          {{ props.model.edges.length }} {{ props.model.edges.length > 1 ? 'relations' : 'relation' }}
        </div>
      </div>
        <div class="text-[11px] text-muted-foreground mt-3 text-right">
          Modifié le {{ $dayjs(props.model.updatedAt).format('DD-MM-YYYY à HH:mm') }}
        </div>
    </CardContent>
  </Card>
</template>
<script setup lang="ts">
import {ref} from 'vue';
import {Workflow, Loader2, PanelTop, EllipsisVertical} from 'lucide-vue-next';
import {useToast} from '@/components/ui/toast/use-toast'
import {Toaster} from '@/components/ui/toast'
import {
  AlertDialog, AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {useMCDStore} from "@/stores/mcd-store.js";
import {storeToRefs} from "pinia";



const props = defineProps({
  model: {
    type: Object,
    required: true,
  },
});

const mcdStore = useMCDStore()
const { models } = storeToRefs(mcdStore)

const { toast } = useToast()

const openModel = async () => {
  await navigateTo(`/app/model/${props.model.id}`);
}


const isLoading = ref(false);
const showDialogDeleteModel = ref(false);
const showDialogRenameModel = ref(false);
const isRenamingModel = ref(false);
const deleteModel = async () => {
  isLoading.value = true;

  const res = await $fetch(`/api/models/delete`, {
    method: 'DELETE',
    query: { id: props.model.id },
  });
  if (res) {
    // remove model from list
    models.value = models.value.filter((model) => model.id !== props.model.id);

    isLoading.value = false;
    showDialogDeleteModel.value = false;
    toast({
      description: 'Le modèle a été supprimé.',
    });
  }
}

const renameModel = async () => {
  isRenamingModel.value = true
  const res = await $fetch(`/api/models/rename-model?id=${props.model.id}`, {
    method: "PUT",
    body: {
      name: props.model.name
    }
  });

  if (res) {
    isRenamingModel.value = false
    showDialogRenameModel.value = false
  }
}
</script>
