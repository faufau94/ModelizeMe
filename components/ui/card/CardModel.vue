<template>
  <Card @click="openModel" class="cursor-pointer hover:border-gray-300 hover:shadow-md duration-150 transition">
    <CardHeader class="flex flex-row items-start gap-4 space-y-0">
      <div class="space-y-1 flex-1">
        <CardTitle class="text-lg">{{ props.model.name.length > 20 ? props.model.name.substring(0, 20) + '...' : props.model.name }}</CardTitle>
      </div>
      <div class="rounded-md text-secondary-foreground">

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button @click.stop="" variant="secondary" class="px-2 shadow-none bg-white">
              <EllipsisVertical :size="15"/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
              align="end"
              :align-offset="-5"
              class="w-[200px]"
          >

            <DropdownMenuItem class="cursor-pointer">
              <AlertDialog v-model:open="showDialogRenameModel">
                <AlertDialogTrigger as-child>
                  <div @click.stop="showDialogRenameModel = true">
                    Renommer
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Renommer le modèle</AlertDialogTitle>
                    <AlertDialogDescription>
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <Form v-slot="{ handleSubmit }" :initial-values="{ name: props.model.name }" :validation-schema="formSchema" as="">
                    <form @submit="handleSubmit($event, rnModel)">
                    <FormField v-slot="{ componentField }" name="name">
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input type="text" v-bind="componentField"/>
                        </FormControl>
                        <FormMessage />
                        <FormControl class="float-right">
                          <Button type="submit" :disabled="isRenamingModel">
                            <Loader2 v-if="isRenamingModel" class="w-4 h-4 mr-2 animate-spin"/>
                            {{ isRenamingModel ? 'Renommage...' : 'Renommer' }}
                          </Button>
                            <Button type="button" variant="secondary" @click.stop="showDialogRenameModel = false">
                              Annuler
                            </Button>
                        </FormControl>
                      </FormItem>
                    </FormField>
                  </form>
                  </Form>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span>Déplacer vers...</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem class="cursor-pointer" v-for="team in selectedWorkspace?.teams" @click.stop="moveModelToTeam(team)" :key="team.id">
                    <span>{{team?.name }}</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem class="cursor-pointer">
              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <div @click.stop="showDialogDeleteModel = true" class="text-red-500">
                    Supprimer
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent v-if="showDialogDeleteModel">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Voulez-vous supprimer ce modèle ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible et supprimera définitement ce modèle.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <Button variant="destructive" @click.stop="delModel" :disabled="isLoading">
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
        <div class="flex items-center gap-x-1 justify-center">
          <PanelTop :size="15"/>
          {{ props.model.nodes.length }} {{ props.model.nodes.length > 1 ? 'nœuds' : 'nœud' }}

        </div>
        <div class="flex items-center gap-x-1">
          <Workflow :size="15"/>
          {{ props.model.edges.length }} {{ props.model.edges.length > 1 ? 'relations' : 'relation' }}
        </div>
        <div v-if="props.model.teamId" class="flex items-center gap-x-1">
          <Users :size="15"/>
          {{ props?.model?.team?.name }}
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
import {Workflow, Loader2, PanelTop, EllipsisVertical, Users} from 'lucide-vue-next';
import {
  AlertDialog, AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {toTypedSchema} from "@vee-validate/zod";
import { z } from "zod";
import {useForm} from 'vee-validate'
import { toast } from 'vue-sonner'
import { useModel } from '@/composables/api/useModel'
import { useWorkspace } from '@/composables/api/useWorkspace'


const props = defineProps({
  model: {
    type: Object,
    required: true,
  },
});


const openModel = async () => {
  await navigateTo(`/app/model/${props.model.id}`);
}

const { renameModel, deleteModel, updateModel } = useModel()
const { selectedWorkspace } = useWorkspace()


const isLoading = ref(false);
const showDialogDeleteModel = ref(false);
const showDialogRenameModel = ref(false);
const isRenamingModel = ref(false);
const delModel = async () => {
  isLoading.value = true;

  
  deleteModel(props.model.id, {
      type: 'model',
      action: 'removeModel'
    })

  
  isLoading.value = false;
  showDialogDeleteModel.value = false;
  toast.success('Le modèle a été supprimé.');
}

const formSchema = toTypedSchema(z.object({
  name: z.string({
    message: "Veuillez remplir le champs."
  }).min(2, 'Le nom doit être supérieur à 2 caractères.').max(50),
}))


const { setValues } = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: ''
  },
  validateOnMount: false,
})



const rnModel = async (values) => {
  isRenamingModel.value = true
  renameModel(props.model.id,{name: values.name})

  setValues({
    name: values.name,
  });

  isRenamingModel.value = false
  showDialogRenameModel.value = false

  toast.success('Le modèle a été renommé avec succès.');
}

const moveModelToTeam = (team: object) => {

  console.log('Moving model to team:', props.model.id);

  console.log('Moving model to team:', team);
  if (!team || !team.id) {
    toast.error('Veuillez sélectionner une équipe valide.');
    return;
  }

  const res = updateModel(props.model.id, {
    teamId: team.id,
  });


  if (!res) {
    toast.error('Une erreur est survenue lors du déplacement du modèle.');
    return;
  }
  toast.success('Ce modèle a été déplacé vers l’équipe ' + team.name);
}
</script>
