<template>

  <div class="w-full max-w-6xl mx-auto px-4 py-8 relative h-screen">
    <Toaster />
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
          <div class="flex w-full flex-start gap-2">
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
                    :class="[state === 'active' && 'ring-2 ring-ring ring-offset-2 ring-offset-background']"
                    :disabled="state !== 'completed' && !meta.valid"
                >
                  <Check v-if="state === 'completed'" class="size-5"/>
                  <div v-else>
                    {{ step.step }}
                  </div>
                </Button>
              </StepperTrigger>

              <div class="mt-3 flex flex-col items-center text-center">
                <StepperTitle
                    :class="[state === 'active' && 'text-primary']"
                    class="text-sm font-semibold transition lg:text-base"
                >
                  {{ step.title }}
                </StepperTitle>
                <StepperDescription
                    :class="[state === 'active' && 'text-primary']"
                    class="sr-only text-xs text-muted-foreground transition md:not-sr-only lg:text-sm"
                >
                  {{ step.description }}
                </StepperDescription>
              </div>
            </StepperItem>
          </div>

          <div class="flex flex-col gap-4 mt-4 px-7">
            <template v-if="stepIndex === 1">
              <div class="w-2/6 mx-auto mt-20 space-y-6">

                <FormField v-slot="{ componentField }" name="model">
                  <FormItem>
                    <FormLabel>Modèle *</FormLabel>

                    <Select v-model="datas.modelId" v-bind="componentField">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectionner un modèle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem  :value="model.id.toString()" v-for="model in models">
                            {{ model.name }}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-model="datas.title" v-slot="{ componentField }" name="name">
                <FormItem>
                  <FormLabel>Nom du projet *</FormLabel>
                  <FormControl>
                    <Input  type="text" v-bind="componentField"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-model="datas.description" v-slot="{ componentField }" name="description">
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea  id="message" placeholder="Informations sur le projet" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              </div>

            </template>

            <template v-if="stepIndex === 2">
              <ListItem :name="steps[1].type" :step-datas="steps.find(step => step.step === stepIndex)"/>
            </template>

            <template v-if="stepIndex === 3">
              <ListItem :name="steps[2].type" :step-datas="{ ...steps.find(step => step.step === stepIndex), options: steps[2].options(datas.framework) }"/>
            </template>

            <template v-if="stepIndex === 4">
              <ListItem :name="steps[3].type" :step-datas="steps.find(step => step.step === stepIndex)"/>
            </template>



          </div>

          <div class="flex items-center justify-end mt-10 space-x-5 px-7">
            <Button :disabled="isPrevDisabled || isGenerating" variant="outline" size="sm" @click="prevStep()">
              Précédent
            </Button>
            <div class="flex items-center gap-3">
              <Button v-if="stepIndex !== 4" :type="meta.valid ? 'button' : 'submit'" :disabled="isNextDisabled"
                      size="sm"
                      @click="meta.valid && nextStep()">
                Suivant
              </Button>
              <Button
                  :disabled="isGenerating"
                  v-if="stepIndex === 4"
                  size="sm"
                  type="submit"
              >
                <CirclePlay v-if="!isGenerating" class="w-5 h-5 mr-2"/>
                <Loader2 v-if="isGenerating" class="w-4 h-4 mr-2 animate-spin" />
                {{ isGenerating ? 'Génération...' : 'Générer' }}
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
import {Check, CirclePlay, Loader2} from 'lucide-vue-next'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/components/ui/toast/use-toast'
import { Toaster } from '@/components/ui/toast'

import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

import {h, ref} from 'vue'
import {
  Stepper,
  StepperDescription,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger
} from '@/components/ui/stepper'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import ListItem from '@/components/generator/ListItem'

definePageMeta({
  layout: 'sidebar',
});

const codeGeneratorStore = useCodeGeneratorStore()
const {steps, stepIndex, datas} = storeToRefs(codeGeneratorStore)

const router = useRouter()
const models = ref(null)
const { toast } = useToast()

const isGenerating = ref(false)

onMounted(async () => {
  models.value = await $fetch('/api/models/list', {method: 'GET'});
})

onUnmounted(() => {
  models.value = null
  datas.value = {
    title: '',
    description: '',
    modelId: '',
    framework: '',
    database: '',
    orm: '',
  }
  stepIndex.value = 1
})

const formSchema = [
  z.object({
    model: z.string({
      required_error: "Veuillez séléctionner une option",
    }),
    name: z.string({
      required_error: "Veuillez entrer un nom",
      invalid_type_error: "Le nom doit être une chaine de caractères",
    }).min(3,'Le nom doit être supérieur à 3 caractères'),
  }),

  z.object({
    framework: z.string({
      required_error: "Veuillez séléctionner une option",
    }),
  }),
  z.object({
    orm: z.string({
      required_error: "Veuillez séléctionner une option",
    }),
  }),
  z.object({
    database: z.string({
      required_error: "Veuillez séléctionner une option",
    }),
  }),
]

async function onSubmit(values) {

  isGenerating.value = true

  const response = await $fetch('/api/generator/generate', {
    method: 'POST',
    body: datas.value,
  });

  if (response.status === 200) {
    console.log('Projet généré:', response.projectName);
    toast({
      title: 'Le projet a bien été généré.',
      description: 'Vous pouvez le télécharger ou bien le cloner sur un dépôt git.',
    })
  } else {
    console.error('Erreur:', response.error);
    toast({
      title: 'Problème de génération.',
      description: 'Il y a eu un problème lors de la génération du projet. Réessayez.',
    })
  }
  isGenerating.value = false
  await navigateTo({path: `/app/generator/result/${projectName}`})
}
</script>

