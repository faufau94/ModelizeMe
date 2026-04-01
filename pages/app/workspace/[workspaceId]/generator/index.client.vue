<template>
  <div class="w-full max-w-4xl mx-auto px-6 py-10">
    <Form
        v-slot="{ meta, values, validate }"
        as="" keep-values :validation-schema="toTypedSchema(formSchema[stepIndex - 1])"
    >
      <Stepper v-slot="{ isNextDisabled, isPrevDisabled, nextStep, prevStep }" v-model="stepIndex" class="block w-full">
        <form
            @submit="(e) => {
              e.preventDefault()
              validate()
              if (stepIndex === steps.length && meta.valid) {
                onSubmit(values)
              }
            }"
        >
          <!-- Stepper header -->
          <div class="flex w-full items-start gap-2">
            <StepperItem
                v-for="step in steps"
                :key="step.step"
                v-slot="{ state }"
                class="relative flex w-full flex-col items-center justify-center"
                :step="step.step"
            >
              <StepperSeparator
                  v-if="step.step !== steps[steps.length - 1].step"
                  class="absolute left-[calc(50%+20px)] right-[calc(-50%+10px)] top-5 block h-0.5 shrink-0 rounded-full bg-muted group-data-[state=completed]:bg-primary"
              />

              <StepperTrigger as-child>
                <Button
                    :variant="state === 'completed' || state === 'active' ? 'default' : 'outline'"
                    size="icon"
                    class="z-10 rounded-full shrink-0"
                    :class="[
                      state === 'active' && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                      state !== 'completed' && state !== 'active' && 'bg-white dark:bg-card'
                    ]"
                    :disabled="state !== 'completed' && !meta.valid"
                >
                  <Check v-if="state === 'completed'" class="size-4"/>
                  <span v-else class="text-sm">{{ step.step }}</span>
                </Button>
              </StepperTrigger>

              <div class="mt-2 flex flex-col items-center text-center">
                <StepperTitle
                    :class="[state === 'active' && 'text-primary']"
                    class="text-xs font-medium transition lg:text-sm"
                >
                  {{ step.title }}
                </StepperTitle>
              </div>
            </StepperItem>
          </div>

          <!-- Step content -->
          <div class="mt-8">
            <!-- Step 1: Informations principales -->
            <template v-if="stepIndex === 1">
              <div class="max-w-md mx-auto space-y-5">
                <FormField v-slot="{ componentField }" name="modelId">
                  <FormItem>
                    <FormLabel>Modèle <span class="text-destructive">*</span></FormLabel>
                    <Select v-bind="componentField">
                      <FormControl>
                        <SelectTrigger class="bg-white dark:bg-card">
                          <SelectValue placeholder="Sélectionner un modèle"/>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem :value="model.id.toString()" v-for="model in models" :key="model.id">
                            {{ model.name }}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage/>
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="title">
                  <FormItem>
                    <FormLabel>Nom du projet <span class="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="mon-projet" class="bg-white dark:bg-card" v-bind="componentField"/>
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="description">
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Décrivez brièvement votre projet..." class="bg-white dark:bg-card" v-bind="componentField"/>
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                </FormField>
              </div>
            </template>

            <!-- Step 2: Framework -->
            <template v-if="stepIndex === 2">
              <ListItem :name="steps[1].type" :step-datas="steps.find(step => step.step === stepIndex)"/>
            </template>

            <!-- Step 3: ORM -->
            <template v-if="stepIndex === 3">
              <ListItem :name="steps[2].type"
                        :step-datas="{ ...steps.find(step => step.step === stepIndex), options: steps[2].options(datas.framework) }"/>
            </template>

            <!-- Step 4: Database -->
            <template v-if="stepIndex === 4">
              <ListItem :name="steps[3].type" :step-datas="steps.find(step => step.step === stepIndex)"/>
            </template>
          </div>

          <!-- Navigation -->
          <div class="flex items-center justify-between mt-10 pt-6 border-t">
            <Button :disabled="isPrevDisabled || isGenerating" variant="ghost" size="sm" @click="prevStep()">
              <ChevronLeft class="w-4 h-4 mr-1"/>
              Précédent
            </Button>
            <div class="flex items-center gap-3">
              <Button v-if="stepIndex !== steps.length" :type="meta.valid ? 'button' : 'submit'"
                      :disabled="isNextDisabled"
                      size="sm"
                      @click="meta.valid && nextStep()">
                Suivant
                <ChevronRight class="w-4 h-4 ml-1"/>
              </Button>
              <Button
                  v-if="stepIndex === steps.length"
                  :disabled="isGenerating"
                  size="sm"
                  type="submit"
              >
                <Loader2 v-if="isGenerating" class="w-4 h-4 mr-2 animate-spin"/>
                <CirclePlay v-else class="w-4 h-4 mr-2"/>
                {{ isGenerating ? 'Génération...' : 'Générer le projet' }}
              </Button>
            </div>
          </div>
        </form>
      </Stepper>
    </Form>
  </div>
</template>

<script setup>
import {useCodeGeneratorStore} from "@/stores/generator-store.js";
import {storeToRefs} from "pinia";
import {Check, ChevronLeft, ChevronRight, CirclePlay, Loader2} from 'lucide-vue-next'
import {Textarea} from '@/components/ui/textarea'
import {toast} from 'vue-sonner'
import {useMLDStore} from "~/stores/mld-store.js";
import {toTypedSchema} from '@vee-validate/zod';
import * as z from 'zod/v4';

import {ref} from 'vue'
import {
  Stepper,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger
} from '@/components/ui/stepper'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import ListItem from '@/components/generator/ListItem'

definePageMeta({
  layout: 'sidebar',
});

const route = useRoute()
const mldStore = useMLDStore()
const codeGeneratorStore = useCodeGeneratorStore()
const {steps, stepIndex, datas} = storeToRefs(codeGeneratorStore)

const models = ref(null)
const isGenerating = ref(false)

onMounted(async () => {
  models.value = await $fetch('/api/models/list', {
    method: 'GET',
    query: { selectedWorkspaceId: route.params.workspaceId },
  });
})

onUnmounted(() => {
  models.value = null
  stepIndex.value = 1
  datas.value = {title: '', description: '', modelId: '', framework: '', database: '', orm: ''}
})

const formSchema = [
  z.object({
    modelId: z.string({
      error: (issue) => issue.input === undefined
          ? "Veuillez sélectionner un modèle."
          : ""
    }),
    title: z.string({
      error: (issue) => issue.input === undefined
          ? "Veuillez entrer un nom."
          : "Le nom doit être une chaîne de caractères."
    }).min(3, 'Le nom doit contenir au moins 3 caractères.'),
    description: z.string().max(1000, 'La description ne doit pas dépasser 1000 caractères.').optional(),
  }),
  z.object({
    framework: z.string({
      error: (issue) => issue.input === undefined
          ? "Veuillez sélectionner un framework."
          : ""
    }),
  }),
  z.object({
    orm: z.string({
      error: (issue) => issue.input === undefined
          ? "Veuillez sélectionner un ORM."
          : ""
    }),
  }),
  z.object({
    database: z.string({
      error: (issue) => issue.input === undefined
          ? "Veuillez sélectionner une base de données."
          : ""
    }),
  }),
]

async function onSubmit(values) {
  isGenerating.value = true

  try {
    const getMCDModel = await $fetch("/api/models/read", {
      method: "GET",
      query: {id: values.modelId},
    });

    const {nodesMLD, edgesMLD} = mldStore.generateMLD(getMCDModel['nodes'], getMCDModel['edges'])

    const response = await $fetch('/api/generator/generate', {
      method: 'POST',
      body: {...values, nodes: nodesMLD, edges: edgesMLD},
    });

    await navigateTo({path: `/app/workspace/${route.params.workspaceId}/generator/result/${response.projectName}`})
  } catch (error) {
    console.error('Erreur:', error);
    toast.error('Il y a eu un problème lors de la génération du projet. Réessayez.')
  } finally {
    isGenerating.value = false
  }
}
</script>
