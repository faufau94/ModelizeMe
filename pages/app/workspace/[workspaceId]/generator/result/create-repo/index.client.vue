<template>
  <div class="flex justify-center items-center min-h-screen p-6">
    <div v-if="isCreatingRepo" class="w-full">
      <StepAnimation/>
    </div>
    <div v-else>
      <Card class="w-[380px]">
        <CardHeader>
          <CardTitle class="text-base">Créer le dépôt</CardTitle>
          <CardDescription>
            Configurez le dépôt avant de le créer sur
            {{ route.query.provider === 'github' ? 'GitHub' : 'GitLab' }}.
          </CardDescription>
        </CardHeader>
        <form @submit="onSubmit">
          <CardContent class="space-y-4">
            <FormField v-slot="{ componentField }" name="projectName">
              <FormItem>
                <FormLabel>Nom du projet</FormLabel>
                <FormControl>
                  <Input placeholder="mon-projet" v-bind="componentField"/>
                </FormControl>
                <FormMessage/>
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="branchName">
              <FormItem>
                <FormLabel>Branche par défaut</FormLabel>
                <FormControl>
                  <Input placeholder="main" v-bind="componentField"/>
                </FormControl>
                <FormMessage/>
              </FormItem>
            </FormField>
          </CardContent>
          <CardFooter class="flex justify-between">
            <Button variant="ghost" type="button" @click="router.back()">
              Retour
            </Button>
            <Button type="submit">
              Créer le dépôt
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  </div>
</template>

<script setup>
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {toTypedSchema} from '@vee-validate/zod';
import * as z from 'zod';
import {useForm} from 'vee-validate'
import {toast} from 'vue-sonner'
import StepAnimation from "@/components/StepAnimation.vue";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';

definePageMeta({
  layout: 'sidebar',
});

const route = useRoute();
const router = useRouter();
const {token} = useAuth();

const formSchema = toTypedSchema(z.object({
  projectName: z.string()
      .min(1, 'Le nom du projet est requis.')
      .max(100)
      .regex(/^[a-zA-Z0-9_-]+$/, 'Caractères autorisés : lettres, chiffres, tirets, underscores.'),
  branchName: z.string()
      .min(1, 'Le nom de la branche est requis.')
      .max(50)
      .regex(/^[a-zA-Z0-9._/-]+$/, 'Nom de branche invalide.'),
}));

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    projectName: route.query.projectName || '',
    branchName: 'main',
  },
  validateOnMount: false,
});

const isCreatingRepo = ref(false);

const onSubmit = form.handleSubmit(async (values) => {
  isCreatingRepo.value = true;

  try {
    const response = await $fetch('/api/generator/create-repo', {
      method: 'POST',
      body: {
        provider: route.query.provider,
        projectName: values.projectName,
        branchName: values.branchName,
        token: token.value,
      },
    });

    if (response.success) {
      toast.success('Dépôt créé avec succès !');
      window.open(response.repoUrl, '_blank');
      await navigateTo(`/app/workspace/${route.params.workspaceId}/generator`);
    }
  } catch (error) {
    console.error('Erreur création dépôt:', error);
    toast.error('Erreur lors de la création du dépôt. Réessayez.');
    isCreatingRepo.value = false;
  }
});
</script>
