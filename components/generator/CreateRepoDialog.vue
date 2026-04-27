<template>
  <Dialog :open="modelValue" @update:open="onOpenChange">
    <DialogContent class="sm:max-w-md" @pointer-down-outside.prevent @escape-key-down.prevent="!isCreating && onOpenChange(false)">

      <!-- Step 1: Form -->
      <template v-if="!isCreating && !isSuccess">
        <DialogHeader>
          <DialogTitle class="text-base">Créer le dépôt</DialogTitle>
          <DialogDescription>
            Configurez le dépôt avant de le créer sur
            {{ provider === 'github' ? 'GitHub' : 'GitLab' }}.
          </DialogDescription>
        </DialogHeader>

        <form @submit.prevent="onSubmit" class="space-y-4">
          <FormField v-slot="{ componentField }" name="projectName">
            <FormItem>
              <FormLabel>Nom du projet</FormLabel>
              <FormControl>
                <Input placeholder="mon-projet" v-bind="componentField"/>
              </FormControl>
              <FormMessage/>
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="visibility">
            <FormItem>
              <FormLabel>Visibilité</FormLabel>
              <Select v-bind="componentField">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue/>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="private">Privé</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage/>
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="description">
            <FormItem>
              <FormLabel>Description <span class="text-muted-foreground font-normal">(optionnel)</span></FormLabel>
              <FormControl>
                <Textarea placeholder="Décrivez votre projet..." class="resize-none" rows="2" v-bind="componentField"/>
              </FormControl>
              <FormMessage/>
            </FormItem>
          </FormField>

          <div class="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" @click="onOpenChange(false)">
              Annuler
            </Button>
            <Button type="submit">
              Créer le dépôt
            </Button>
          </div>
        </form>
      </template>

      <!-- Step 2: Creating (progress animation) -->
      <template v-if="isCreating">
        <div class="py-8">
          <div class="relative h-24">
            <transition name="fade-slide" mode="out-in">
              <div :key="currentStep" class="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div class="flex items-center gap-2 mb-2">
                  <Loader2 class="w-5 h-5 animate-spin text-primary"/>
                  <h2 class="text-base font-semibold">{{ progressSteps[currentStep].title }}</h2>
                </div>
                <p class="text-sm text-muted-foreground">{{ progressSteps[currentStep].description }}</p>
              </div>
            </transition>
          </div>
          <div class="mt-4 px-4">
            <div class="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                class="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                :style="{ width: `${((currentStep + 1) / progressSteps.length) * 100}%` }"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- Step 3: Success -->
      <template v-if="isSuccess">
        <div class="py-6 flex flex-col items-center text-center gap-4">
          <div class="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 class="h-6 w-6 text-green-600 dark:text-green-400"/>
          </div>
          <div class="space-y-1">
            <h2 class="text-lg font-semibold">Dépôt créé avec succès !</h2>
            <p class="text-sm text-muted-foreground">
              Votre projet a été poussé sur {{ provider === 'github' ? 'GitHub' : 'GitLab' }}.
            </p>
          </div>
          <div class="flex gap-2 pt-2">
            <Button variant="outline" @click="onOpenChange(false)">
              Fermer
            </Button>
            <Button @click="openRepo">
              <ExternalLink class="w-4 h-4 mr-2"/>
              Ouvrir le dépôt
            </Button>
          </div>
        </div>
      </template>

    </DialogContent>
  </Dialog>
</template>

<script setup>
import {ref, watch, onUnmounted} from 'vue'
import {toTypedSchema} from '@vee-validate/zod'
import * as z from 'zod'
import {useForm} from 'vee-validate'
import {toast} from 'vue-sonner'
import {Loader2, CheckCircle2, ExternalLink} from 'lucide-vue-next'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  provider: { type: String, required: true },
  projectName: { type: String, required: true },
  generatedProjectName: { type: String, required: true },
  /** Auto-submit after OAuth redirect (account just got linked) */
  autoSubmit: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'success'])

const isCreating = ref(false)
const isSuccess = ref(false)
const repoUrl = ref('')
const currentStep = ref(0)
let stepTimer = null

const progressSteps = [
  { title: 'Initialisation du dépôt', description: 'Création de la structure du projet...' },
  { title: 'Configuration', description: 'Ajout des fichiers de configuration...' },
  { title: 'Envoi des fichiers', description: 'Push du code source vers le dépôt...' },
  { title: 'Finalisation', description: 'Vérification et nettoyage...' },
]

const formSchema = toTypedSchema(z.object({
  projectName: z.string()
    .min(1, 'Le nom du projet est requis.')
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Caractères autorisés : lettres, chiffres, tirets, underscores.'),
  visibility: z.enum(['private', 'public']),
  description: z.string().max(200).optional(),
}))

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    projectName: props.projectName || '',
    visibility: 'private',
    description: '',
  },
  validateOnMount: false,
})

// Re-fill form with current prop values on every open
watch(() => props.modelValue, (open) => {
  if (open) {
    form.resetForm({
      values: {
        projectName: props.projectName || '',
        visibility: 'private',
        description: '',
      },
    })
  }
})

const onOpenChange = (open) => {
  if (!isCreating.value) {
    emit('update:modelValue', open)
    if (!open) {
      isSuccess.value = false
      isCreating.value = false
      currentStep.value = 0
      repoUrl.value = ''
    }
  }
}

const startProgressAnimation = () => {
  currentStep.value = 0
  stepTimer = setInterval(() => {
    if (currentStep.value < progressSteps.length - 1) {
      currentStep.value++
    }
  }, 3000)
}

const stopProgressAnimation = () => {
  if (stepTimer) {
    clearInterval(stepTimer)
    stepTimer = null
  }
}

/** Actually create the repo (called after account is confirmed linked) */
const createRepo = async (values) => {
  isCreating.value = true
  startProgressAnimation()

  try {
    const response = await $fetch('/api/generator/create-repo', {
      method: 'POST',
      body: {
        provider: props.provider,
        projectName: values.projectName,
        generatedProjectName: props.generatedProjectName,
        branchName: 'main',
        visibility: values.visibility,
        description: values.description || '',
      },
    })

    if (response.success) {
      stopProgressAnimation()
      currentStep.value = progressSteps.length - 1
      repoUrl.value = response.repoUrl
      isCreating.value = false
      isSuccess.value = true
      emit('success')
    }
  } catch (error) {
    stopProgressAnimation()
    isCreating.value = false

    const status = error?.response?.status || error?.statusCode
    const serverMessage = error?.data?.message || error?.data?.statusMessage

    if (status === 409) {
      toast.error(serverMessage || 'Un dépôt avec ce nom existe déjà.')
    } else if (status === 403) {
      toast.error(serverMessage || 'Reconnectez votre compte Git.')
    } else {
      toast.error(serverMessage || 'Erreur lors de la création du dépôt. Réessayez.')
    }
  }
}

const onSubmit = form.handleSubmit(async (values) => {
  await createRepo(values)
})

// Auto-submit after returning from OAuth redirect
onMounted(() => {
  if (props.autoSubmit && props.modelValue) {
    nextTick(() => {
      onSubmit()
    })
  }
})

const openRepo = () => {
  if (repoUrl.value) {
    window.open(repoUrl.value, '_blank')
  }
}

onUnmounted(() => {
  stopProgressAnimation()
})
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
