<template>

    <DialogContent :onInteractOutside="(e) => {
      e.preventDefault()
      console.log('interactOutside')
    }" class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Importer un fichier</DialogTitle>
        <DialogDescription>
          Vous ne pouvez importer qu'un seul fichier.
        </DialogDescription>
      </DialogHeader>
      <div class="w-full max-w-md mx-auto space-y-4">
        <div
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onDrop"
            :class="[
        'flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-border bg-background',
        'hover:border-primary hover:bg-primary/5'
      ]"
        >
          <input
              type="file"
              ref="fileInput"
              @change="onFileSelected"
              class="hidden"
              :accept="allowedFileTypes.join(',')"
          />
          <div class="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-4">
            <UploadIcon class="w-5 h-5 text-primary" />
          </div>
          <h3 class="text-md text-center font-semibold mb-1">Glisser/Déposer un fichier ou cliquer pour importer</h3>
          <p class="text-sm text-muted-foreground mb-4">
            Supporte les fichiers {{ allowedFileTypes.join(', ') }}
          </p>
          <button
              @click="$refs.fileInput.click()"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
          >
            Séléctionner un fichier
          </button>

          <Alert v-if="errorMessage !== ''" class="mt-4" variant="destructive">
            <AlertCircle class="w-4 h-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              {{ errorMessage }}
            </AlertDescription>
          </Alert>
        </div>

        <div v-if="file" class="p-4 border rounded-lg bg-background">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <FileIcon class="w-5 h-5 text-primary" />
              </div>
              <div>
                <p class="text-sm font-medium">{{ file.name }}</p>
                <p class="text-xs text-muted-foreground">{{ formatFileSize(file.size) }}</p>
              </div>
            </div>
            <button
                @click="removeFile"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
            >
              <XIcon class="w-4 h-4" />
              <span class="sr-only">Supprimer le fichier</span>
            </button>
          </div>
        </div>
      </div>
      <DialogFooter v-if="file">
          <DialogClose as-child>
            <Button type="button" variant="secondary">
              Fermer
            </Button>
          </DialogClose>
          <Button @click="handleFile" :disabled="isConvertingFile">
            <Loader2 v-if="isConvertingFile" class="w-4 h-4 mr-2 animate-spin"/>
            {{ isConvertingFile ? 'Importation...' : 'Importer' }}
          </Button>
      </DialogFooter>
    </DialogContent>


</template>

<script setup>
import { ref } from 'vue'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {Copy, Loader2} from 'lucide-vue-next'
import { useConvertToFlowElements } from '@/composables/useConvertToFlowElements';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-vue-next'


import { UploadIcon, FileIcon, XIcon } from 'lucide-vue-next'
import {useMCDStore} from "~/stores/mcd-store.js";


defineProps({
  menuItem: String,
})


const { convertSQLToFlowElements, convertXMLToFlowElements } = useConvertToFlowElements();
const mcdStore = useMCDStore()

const isDragging = ref(false)
const file = ref(null)
const fileInput = ref(null)

const errorMessage = ref('')
const allowedFileTypes = ['.xml', '.sql']
const isConvertingFile = ref(false)

const handleFile = () => {
  isConvertingFile.value = true
  if (file.value) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const fileContent = e.target.result;
      const fileType = file.value.name.split('.').pop().toLowerCase();

      let nodes, edges;

      if (fileType === 'sql') {
        ({nodes, edges} = convertSQLToFlowElements(fileContent));
      } else if (fileType === 'xml') {
        ({nodes, edges} = convertXMLToFlowElements(fileContent));
      }

      if (nodes && edges) {
        mcdStore.flowMCD.addNodes(nodes);
        mcdStore.flowMCD.addEdges(edges);
      }
    };

    reader.readAsText(file.value);
  }
  isConvertingFile.value = false
}

const onDragOver = () => {
  isDragging.value = true
}

const onDragLeave = () => {
  isDragging.value = false
}

const onDrop = (e) => {
  errorMessage.value = ''
  isDragging.value = false
  const droppedFile = e.dataTransfer.files[0]
  if (isValidFileType(droppedFile)) {
    file.value = droppedFile
  } else {
    errorMessage.value = 'Fichier invalide'
  }
}

const onFileSelected = (e) => {
  errorMessage.value = ''
  const selectedFile = e.target.files[0]
  if (isValidFileType(selectedFile)) {
    file.value = selectedFile
  } else {
    errorMessage.value = 'Fichier invalide'
  }
  fileInput.value.value = '' // Reset file input
}

const removeFile = () => {
  file.value = null
}

const isValidFileType = (file) => {
  return allowedFileTypes.some(type => file.name.toLowerCase().endsWith(type))
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

onUnmounted(() => {
  isDragging.value = false
  file.value = null
  errorMessage.value = ''
})
</script>
