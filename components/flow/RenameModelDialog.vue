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
import { z } from "zod/v4";;

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

const onSubmit = form.handleSubmit(async (values) => {
  isLoadingNewModel.value = true;

  const res = await $fetch('/api/models/create', {
    method: 'POST',
    body: {
      title: values.title
    },
  });

  if (res) {
    isLoadingNewModel.value = false;
    showModel.value = false;
    await navigateTo('/app/model/' + res.id.toString());
  }

})
</script>