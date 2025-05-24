<template>
  <div class="flex justify-center items-center min-h-screen">
    <div v-if="isCreatingRepo" class="w-full">
      <StepAnimation />
    </div>
    <div v-else>
      <Card class="w-[350px]">
        <CardHeader>
          <CardTitle>Création du dépôt {{ route.params.provider }}</CardTitle>
          <CardDescription>Renseignez les informations suivantes avant de créer le dépôt.</CardDescription>
        </CardHeader>
        <form @submit="onSubmit">
          <CardContent>
            <div class="grid items-center w-full gap-4">
              <FormField v-slot="{ componentField }" name="projectName">
                <FormItem>
                  <FormLabel>Nom du projet</FormLabel>
                  <FormControl>
                    <Input id="projectName" placeholder="" v-bind="componentField"/>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="branchName">
                <FormItem>
                  <FormLabel>Nom de la branche</FormLabel>
                  <FormControl>
                    <Input id="branchName" placeholder="master" v-bind="componentField"/>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              </FormField>
            </div>
          </CardContent>
          <CardFooter class="flex justify-between px-6 pb-6">
            <Button variant="outline" @click="router.back()">
              Retour
            </Button>
            <Button type="submit">Créer</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  </div>
</template>

<script setup>
import {FormField, FormItem, FormControl, FormLabel, FormMessage} from '@/components/ui/form'
import {toTypedSchema} from '@vee-validate/zod';
import * as z from 'zod';
import {useForm} from 'vee-validate'
import StepAnimation from "@/components/StepAnimation.vue";

definePageMeta({
  layout: 'sidebar',
});

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';

const route = useRoute();
const router = useRouter();

const formSchema = toTypedSchema(z.object({
  projectName: z.string({
    error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : ""
  }).min(2, 'Le nom du projet doit contenir au moins 2 caractères.')
    .max(50, 'Le nom du projet ne doit pas dépasser 50 caractères.'),
  branchName: z.string({
    error: (issue) => issue.input === undefined 
    ? "Veuillez remplir le champs." 
    : ""
  }).min(2, 'Le nom du projet doit contenir au moins 2 caractères.')
    .max(50, 'Le nom de la branche ne doit pas dépasser 50 caractères.'),
}));

const project = ref({
  projectName: '',
  branchName: 'master',
});

const form = useForm({
  validationSchema: formSchema,
  initialValues: project.value,
  validateOnMount: false,
});

const isCreatingRepo = ref(false);

const onSubmit = form.handleSubmit((values) => {
  // Create the repository
  isCreatingRepo.value = true;

});
</script>