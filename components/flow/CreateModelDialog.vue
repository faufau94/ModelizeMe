<template>
  <Dialog v-model:open="isCreateModelDialogOpen">
    <DialogTrigger as-child>
      <Button @click="isCreateModelDialogOpen = true">
        <CirclePlus :size="20" class="mr-2"/>
        Nouveau modèle
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Nouveau modèle</DialogTitle>
        <DialogDescription>
          Ajouter un nouveau modèle.
        </DialogDescription>
      </DialogHeader>

      <Form v-slot="{ handleSubmit }" :validation-schema="formSchema" as="">
        <form @submit="handleSubmit($event, onSubmit)">
        <FormField v-slot="{ componentField }" name="title">
          <FormItem>
            <FormLabel>Nom</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField"/>
            </FormControl>
            <FormDescription>
              Il pourra toujours être modifié plus tard.
            </FormDescription>
            
            <FormMessage />
            <FormControl class="float-right">
              <Button type="submit" :disabled="isLoadingNewModel">
                <Loader2 v-if="isLoadingNewModel" class="w-4 h-4 mr-2 animate-spin"/>
                {{ isLoadingNewModel ? 'Ajout...' : 'Ajouter' }}
              </Button>
            </FormControl>
          </FormItem>
        </FormField>
        </form>
      </Form>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import {Dialog, DialogContent, DialogFooter, DialogTrigger,} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {AlertCircle, CheckCircle, CirclePlus, Loader2} from "lucide-vue-next";
import {ref} from "vue";
import { useForm } from 'vee-validate'
import {toTypedSchema} from "@vee-validate/zod";
import { z } from "zod/v4";

import { useModel } from '@/composables/api/useModel'

import { useWorkspaceStore } from '@/stores/api/workspace-store'
import { toast } from 'vue-sonner'


const formSchema = toTypedSchema(z.object({
  title: z.string({
    error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : "" 
  }).min(2, 'Le nom doit être supérieur à 2 caractères.').max(50),
}))

const form = useForm({
  validationSchema: formSchema,
})


const { addModel } = useModel()
const workspaceStore = useWorkspaceStore()
const { selectedWorkspaceId } = storeToRefs(workspaceStore)

const isCreateModelDialogOpen = ref(false);
const isLoadingNewModel = ref(false);


const onSubmit = async (values) => {
  isLoadingNewModel.value = true
  
  const res = await addModel({...values, selectedWorkspaceId: selectedWorkspaceId.value})
  
  form.resetForm()
  isLoadingNewModel.value = false
  isCreateModelDialogOpen.value = false;

  if (res.status === 200) {
    toast.success(res.body.message)
  } else {
    toast.error(res.body.message);
  }
}
</script>