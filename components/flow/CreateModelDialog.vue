<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button @click="showModel = true">
        <CirclePlus :size="20" class="mr-2"/>
        Nouveau modèle
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]" v-if="showModel">
      <DialogHeader>
        <DialogTitle>Nouveau modèle</DialogTitle>
        <DialogDescription>
          Ajouter un nouveau modèle.
        </DialogDescription>
      </DialogHeader>

      <form @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="title">
          <FormItem>
            <FormLabel>Nom</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" @keyup.enter="onSubmit"/>
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
import {CirclePlus, Loader2} from "lucide-vue-next";
import {ref} from "vue";
import { useForm } from 'vee-validate'
import {toTypedSchema} from "@vee-validate/zod";
import { z } from "zod/v4";

import { useModel } from '@/composables/api/useModel'

import { useWorkspaceStore } from '@/stores/api/workspace-store'

const showModel = ref(false);
const isLoadingNewModel = ref(false);

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

const message = ref({
  type: '',
  text: ''
})

const { addModel } = useModel()
const workspaceStore = useWorkspaceStore()
const { selectedWorkspaceId } = storeToRefs(workspaceStore)
const isFormLoading = ref(false)

const onSubmit = form.handleSubmit(async (values) => {
  try {
    
    message.type = ''
    message.text = ''
    isFormLoading.value = true

    console.log("selectedWorkspace.id", selectedWorkspaceId.value);
    

    const res = await addModel({...values, selectedWorkspaceId: selectedWorkspaceId.value})
    
    // Ici, vous feriez normalement un appel API pour créer l'espace de travail
    console.log('Création de l\'espace de travail:', values)
    
    if (res.status === 200) {
     
      // Affichage d'une notification de succès
      message.type = 'success'
      message.text = 'Espace de travail créé avec succès !'
      
      // Réinitialisation du formulaire après un court délai
      setTimeout(() => {
        form.resetForm()
        isCreateWorkspaceDialogOpen.value = false
        message.type = ''
        message.text = ''
      }, 2000)
  }
    
  } catch (error) {
    console.error('Erreur lors de la création de l\'espace de travail:', error)
    message.type = 'error'
    message.text = 'Une erreur est survenue lors de la création de l\'espace de travail.'
  } finally {
    isFormLoading.value = false
  }

})
</script>