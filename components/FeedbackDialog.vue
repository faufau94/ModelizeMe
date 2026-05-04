<template>
  <Dialog v-model:open="isOpen">
    <slot name="trigger" :open="() => isOpen = true" />
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>Envoyer un feedback</DialogTitle>
        <DialogDescription>
          Aidez-nous à améliorer {{ appName }}. Partagez vos idées, signalements de bugs ou suggestions.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="submitFeedback" class="space-y-4 mt-2">
        <!-- Category -->
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none">Catégorie</label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="cat in categories"
              :key="cat.value"
              type="button"
              @click="selectedCategory = cat.value"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer"
              :class="selectedCategory === cat.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >
              <component :is="cat.icon" class="h-3.5 w-3.5" />
              {{ cat.label }}
            </button>
          </div>
        </div>

        <!-- Message -->
        <div class="space-y-2">
          <label for="feedback-message" class="text-sm font-medium leading-none">Message</label>
          <Textarea
            id="feedback-message"
            v-model="message"
            placeholder="Décrivez votre retour en détail..."
            class="min-h-[120px] resize-none"
          />
        </div>

        <!-- Footer -->
        <DialogFooter class="gap-2">
          <Button type="button" variant="outline" @click="isOpen = false">
            Annuler
          </Button>
          <Button type="submit" :disabled="!message.trim() || isSubmitting">
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            {{ isSubmitting ? 'Envoi...' : 'Envoyer' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
const appName = useAppName()
import { ref } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bug, Lightbulb, Loader2, MessageSquare, ThumbsUp } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const isOpen = defineModel<boolean>('open', { default: false })

const selectedCategory = ref('suggestion')
const message = ref('')
const isSubmitting = ref(false)

const categories = [
  { value: 'suggestion', label: 'Suggestion', icon: Lightbulb },
  { value: 'bug', label: 'Bug', icon: Bug },
  { value: 'feedback', label: 'Retour général', icon: MessageSquare },
  { value: 'praise', label: 'J\'aime bien !', icon: ThumbsUp },
]

const submitFeedback = async () => {
  if (!message.value.trim()) return

  isSubmitting.value = true
  try {
    await $fetch('/api/feedback/create', {
      method: 'POST',
      body: {
        category: selectedCategory.value,
        message: message.value.trim(),
      },
    })
    toast.success('Merci pour votre feedback !')
    message.value = ''
    selectedCategory.value = 'suggestion'
    isOpen.value = false
  } catch (error) {
    toast.error('Erreur lors de l\'envoi du feedback. Réessayez.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
