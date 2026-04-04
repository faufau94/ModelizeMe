<template>
  <Card 
    @click="handleCardClick" 
    class="relative group cursor-pointer border transition-all duration-200 bg-card"
    :class="[
      isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-primary/50 hover:shadow-md',
      selectionMode ? 'cursor-pointer' : ''
    ]"
  >
    <CardHeader class="flex flex-row items-start justify-between gap-4 space-y-0 pb-3 pt-5 px-5">
      <div class="space-y-1 flex-1">
        <CardTitle class="text-lg font-semibold leading-tight tracking-tight">
          {{ props.model.name.length > 25 ? props.model.name.substring(0, 25) + '...' : props.model.name }}
        </CardTitle>
      </div>
      <div class="rounded-md text-secondary-foreground z-10">

        <!-- Selection mode: show checkbox instead of dropdown -->
        <div v-if="selectionMode" class="flex items-center justify-center h-8 w-8">
          <Checkbox
            :checked="isSelected"
            @click.stop="emit('toggle-select', props.model.id)"
          />
        </div>

        <!-- Normal mode: show dropdown menu -->
        <DropdownMenu v-else>
          <DropdownMenuTrigger as-child>
            <Button @click.stop="" variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground">
              <EllipsisVertical class="h-4 w-4"/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
              align="end"
              class="w-[200px]"
          >

            <DropdownMenuItem class="cursor-pointer" @click.stop="showDialogRenameModel = true">
              <Pencil class="mr-2 h-4 w-4" />
              Renommer
            </DropdownMenuItem>

            <DropdownMenuItem class="cursor-pointer" @click.stop="handleDuplicate" :disabled="isDuplicating">
              <Copy class="mr-2 h-4 w-4" />
              {{ isDuplicating ? 'Duplication...' : 'Dupliquer' }}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger class="cursor-pointer">
                <ArrowRightToLine class="mr-2 h-4 w-4" />
                <span>Déplacer vers une équipe</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <template v-if="selectedWorkspace?.teams?.length">
                    <DropdownMenuItem class="cursor-pointer" v-for="team in selectedWorkspace.teams" @click.stop="moveModelToTeam(team)" :key="team.id">
                      <span>{{ team?.name }}</span>
                    </DropdownMenuItem>
                  </template>
                  <DropdownMenuItem v-else disabled class="text-muted-foreground text-xs italic">
                    Aucune équipe disponible
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger class="cursor-pointer">
                <ExternalLink class="mr-2 h-4 w-4" />
                <span>Copier vers un workspace</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <template v-if="otherWorkspaces.length">
                    <DropdownMenuItem class="cursor-pointer" v-for="ws in otherWorkspaces" @click.stop="handleCopyToWorkspace(ws.id)" :key="ws.id">
                      <span>{{ ws.name }}</span>
                    </DropdownMenuItem>
                  </template>
                  <DropdownMenuItem v-else disabled class="text-muted-foreground text-xs italic">
                    Aucun autre workspace
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem class="cursor-pointer !text-red-600 focus:!text-red-700 focus:!bg-red-50" @click.stop="showDialogDeleteModel = true">
              <Trash2 class="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </CardHeader>

    <CardContent class="px-5 pb-5 pt-0">
      
      <!-- Stats / metrics -->
      <div class="flex flex-wrap gap-1.5 mt-4">
        <Badge variant="outline" class="gap-1 px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
          <PanelTop class="w-3 h-3"/>
          {{ props.model.nodes?.length || 0 }} {{ props.model.nodes?.length > 1 ? 'Entités' : 'Entité' }}
        </Badge>
        <Badge variant="outline" class="gap-1 px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
          <Workflow class="w-3 h-3"/>
          {{ props.model.edges?.length || 0 }} {{ props.model.edges?.length > 1 ? 'Relations' : 'Relation' }}
        </Badge>
        <Badge v-if="props.model.teamId" variant="outline" class="gap-1 px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
          <Users class="w-3 h-3"/>
          {{ props?.model?.team?.name }}
        </Badge>
      </div>

      <!-- Footer: active viewers + date -->
      <div class="mt-6 flex items-center justify-between border-t pt-4">
        <div v-if="props.viewers?.length" class="flex items-center -space-x-1.5">
          <TooltipProvider v-for="viewer in props.viewers.slice(0, 3)" :key="viewer.userId">
            <Tooltip>
              <TooltipTrigger as-child>
                <div class="relative">
                  <Avatar class="w-6 h-6 border-2 bg-card border-card shadow-sm ring-2 ring-primary/40">
                    <AvatarImage v-if="viewer.userImage" :src="viewer.userImage" :alt="viewer.userName" />
                    <AvatarFallback class="text-[9px] text-muted-foreground">{{ viewer.userName?.substring(0, 2).toUpperCase() || '?' }}</AvatarFallback>
                  </Avatar>
                  <span class="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border-[1.5px] border-white rounded-full"></span>
                </div>
              </TooltipTrigger>
              <TooltipContent class="text-xs">
                <p>{{ viewer.userName }} - en ligne</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span v-if="props.viewers.length > 3" class="text-[10px] text-primary-500 font-medium ml-1">+{{ props.viewers.length - 3 }}</span>
        </div>
        <div v-else></div>
        <p class="text-[11px] text-muted-foreground">
          {{ $dayjs(props.model.updatedAt).format('DD MMM YYYY à HH:mm') }}
        </p>
      </div>
    </CardContent>
  </Card>

  <!-- Dialogs are moved outside the Card to avoid clicking issues -->
  <AlertDialog :open="showDialogRenameModel" @update:open="showDialogRenameModel = $event">
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
            <div class="flex justify-end gap-2 mt-4">
               <Button type="button" variant="outline" @click="showDialogRenameModel = false">
                  Annuler
                </Button>
              <Button type="submit" :disabled="isRenamingModel">
                <Loader2 v-if="isRenamingModel" class="w-4 h-4 mr-2 animate-spin"/>
                {{ isRenamingModel ? 'Renommage...' : 'Renommer' }}
              </Button>
            </div>
          </FormItem>
        </FormField>
      </form>
      </Form>
    </AlertDialogContent>
  </AlertDialog>

  <AlertDialog :open="showDialogDeleteModel" @update:open="showDialogDeleteModel = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Voulez-vous supprimer ce modèle ?</AlertDialogTitle>
        <AlertDialogDescription>
          Cette action est irréversible et supprimera définitement ce modèle.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="showDialogDeleteModel = false">Annuler</AlertDialogCancel>
        <Button variant="destructive" @click="delModel" :disabled="isLoading">
          <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin"/>
          {{ isLoading ? 'Suppression...' : 'Supprimer' }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

</template>
<script setup lang="ts">
import {ref} from 'vue';
import {Workflow, Loader2, PanelTop, EllipsisVertical, Users, Copy, ArrowRightToLine, ExternalLink, Pencil, Trash2} from 'lucide-vue-next';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertDialog, AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
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
  viewers: {
    type: Array as () => Array<{ userId: string; userName: string; userImage?: string | null }>,
    default: () => []
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  selectionMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle-select']);

const handleCardClick = async (e: Event) => {
  if (props.selectionMode) {
    emit('toggle-select', props.model.id)
    return
  }
  await openModel(e)
}

const openModel = async (e: Event) => {
  // Prevent opening the model if clicking on dropdown
  const target = e.target as HTMLElement;
  if (target.closest('[role="menuitem"]')) return;
  
  await navigateTo(`/app/model/${props.model.id}`);
}

const { renameModel, deleteModel, updateModel, duplicateModel } = useModel()
const { selectedWorkspace, workspaces, selectedWorkspaceId } = useWorkspace()

const otherWorkspaces = computed(() =>
  workspaces.value?.filter((ws) => ws.id !== selectedWorkspaceId.value) || []
)

const isDuplicating = ref(false)
const handleDuplicate = async () => {
  try {
    isDuplicating.value = true
    await duplicateModel(props.model.id)
    toast.success('Modèle dupliqué avec succès')
  } catch (err) {
    toast.error('Erreur lors de la duplication')
  } finally {
    isDuplicating.value = false
  }
}

const handleCopyToWorkspace = async (targetWorkspaceId: string) => {
  try {
    await duplicateModel(props.model.id, targetWorkspaceId)
    toast.success('Modèle copié vers un autre workspace')
  } catch (err) {
    toast.error('Erreur lors de la copie')
  }
}


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
