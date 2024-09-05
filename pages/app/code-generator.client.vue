<template>

  <div class="w-full max-w-6xl mx-auto px-4 py-8 relative h-screen">
    <Form
        v-slot="{ meta, values, validate }"
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
                    <FormLabel>Modèle</FormLabel>

                    <Select v-bind="componentField">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectionner un modèle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem :value="model.id" v-for="model in models">
                            {{ model.name }}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="name">
                <FormItem>
                  <FormLabel>Nom du projet</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField"/>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="desc">
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea id="message" placeholder="Informations sur le projet" v-bind="componentField" />
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              </FormField>
              </div>

            </template>

            <template v-if="stepIndex === 2">
              <ListItem :step-datas="steps.find(step => step.step === stepIndex)"/>
            </template>

            <template v-if="stepIndex === 3">
              <ListItem :step-datas="{ ...steps.find(step => step.step === stepIndex), options: steps[2].options(datas.framework) }"/>
            </template>

            <template v-if="stepIndex === 4">
              <ListItem :step-datas="steps.find(step => step.step === stepIndex)"/>
            </template>



          </div>

          <div class="flex items-center justify-end mt-10 space-x-5 px-7">
            <Button :disabled="isPrevDisabled" variant="outline" size="sm" @click="prevStep()">
              Précédent
            </Button>
            <div class="flex items-center gap-3">
              <Button v-if="stepIndex !== 4" :type="meta.valid ? 'button' : 'submit'" :disabled="isNextDisabled"
                      size="sm"
                      @click="meta.valid && nextStep()">
                Suivant
              </Button>
              <Button
                  v-if="stepIndex === 4" size="sm" type="submit"
              >
                <CirclePlay class="w-5 h-5 mr-2"/>
                Générer
              </Button>
            </div>
          </div>
        </form>
      </Stepper>
    </Form>
  </div>
</template>

<script setup>
import {useCodeGeneratorStore} from "@/stores/code-generator-store.js";
import {storeToRefs} from "pinia";
import {Check, CirclePlay} from 'lucide-vue-next'
import { Textarea } from '@/components/ui/textarea'

import {h} from 'vue'
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
import {toast} from '@/components/ui/toast'
import ListItem from '@/components/code-generator/ListItem'
import prisma from '~/lib/prisma';


definePageMeta({
  layout: 'sidebar',
});

const codeGeneratorStore = useCodeGeneratorStore()
const {steps, stepIndex, datas} = storeToRefs(codeGeneratorStore)

const models = ref(null)

onMounted(async () => {
  models.value = await $fetch('/api/models/list', {method: 'GET'});
})


function onSubmit(values) {
  toast({
    title: 'You submitted the following values:',
    description: h('pre', {class: 'mt-2 w-[340px] rounded-md bg-slate-950 p-4'}, h('code', {class: 'text-white'}, JSON.stringify(values, null, 2))),
  })
}
</script>

