<template>

    <DialogContent :onInteractOutside="(e) => {
      e.preventDefault()
    }" class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Importer un fichier</DialogTitle>
        <DialogDescription>
          Vous ne pouvez importer qu'un seul fichier.
        </DialogDescription>
      </DialogHeader>
      <!-- Format info -->
      <div class="rounded-lg border bg-muted/30 px-3 py-2.5 space-y-2.5">
        <!-- Format chips -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-xs text-muted-foreground font-medium mr-0.5">Formats :</span>
          <button
            v-for="fmt in formatOptions"
            :key="fmt.id"
            type="button"
            class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors"
            :class="activeFormat === fmt.id
              ? 'bg-primary/10 border-primary/40 text-primary font-medium'
              : 'bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'"
            @click="activeFormat = activeFormat === fmt.id ? null : fmt.id"
          >
            <component :is="fmt.icon" class="w-3 h-3" />
            {{ fmt.label }}
          </button>
        </div>

        <!-- Format detail (shown when a chip is active) -->
        <Transition
          enter-active-class="transition-all duration-150 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-100 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <div v-if="activeFormat" class="text-xs text-muted-foreground space-y-2 pt-0.5 border-t border-border/60">
            <p class="pt-1.5">{{ formatOptions.find(f => f.id === activeFormat)?.description }}</p>
            <div v-if="activeFormat === 'json-structured'" class="flex items-center gap-2">
              <span class="text-muted-foreground/70">Types :</span>
              <span class="font-mono">{{ supportedTypes.join(' · ') }}</span>
            </div>
            <div v-if="activeFormat === 'json-structured'" class="flex items-center gap-2">
              <span class="text-muted-foreground/70">Cardinalités :</span>
              <span class="font-mono">{{ supportedCardinalities.join(' · ') }}</span>
            </div>
            <button
              v-if="activeFormat !== 'sql-ddl'"
              type="button"
              class="flex items-center gap-1.5 font-medium text-primary hover:text-primary/80 transition-colors"
              @click="downloadExample"
            >
              <DownloadIcon class="w-3.5 h-3.5 flex-shrink-0" />
              Télécharger un exemple JSON
            </button>
          </div>
        </Transition>
      </div>

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
            <AlertTitle>Erreur d'import</AlertTitle>
            <AlertDescription class="space-y-2">
              <p>{{ errorMessage }}</p>
              <button
                v-if="isJsonError"
                type="button"
                class="flex items-center gap-1.5 text-xs font-medium underline underline-offset-2 opacity-90 hover:opacity-100 transition-opacity"
                @click="downloadExample"
              >
                <DownloadIcon class="w-3.5 h-3.5 flex-shrink-0" />
                Télécharger un exemple JSON valide
              </button>
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
const appName = useAppName()
import { nextTick, ref } from 'vue'

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
import { Loader2, UploadIcon, FileIcon, XIcon, DownloadIcon, FileJson2, Database, RefreshCcw } from 'lucide-vue-next'
import { useImport } from '@/composables/useImport';
import { getLayoutedElements, computeElkOptions } from '@/utils/useElk.js';
import { resolveCollisions } from '@/utils/useCollisions.js';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-vue-next'

import {useModelStore} from "~/stores/model-store.js";
import {useCollaborationStore} from "~/stores/collaboration-store.js";
import {useUndoRedoStore} from "~/stores/undo-redo-store.js";


const activeFormat = ref(null)

const supportedTypes = ['String', 'Integer', 'Big Integer', 'Decimal', 'Text', 'Date', 'Timestamp', 'Boolean']
const supportedCardinalities = ['0,1', '1,1', '0,N', '1,N']

const formatOptions = [
  {
    id: 'json-export',
    label: 'JSON export',
    icon: RefreshCcw,
    description: 'Re-import d\'un JSON exporté depuis ' + appName + ' - contient nodes + edges, prêt à l\'emploi.',
  },
  {
    id: 'json-structured',
    label: 'JSON structuré',
    icon: FileJson2,
    description: 'Format manuel : un objet avec entities (tableaux de propriétés) et relationships. Téléchargez l\'exemple pour voir la structure complète.',
  },
  {
    id: 'sql-ddl',
    label: 'SQL DDL',
    icon: Database,
    description: 'Instructions CREATE TABLE - MySQL, PostgreSQL, SQLite et SQL Server. Les clés primaires, étrangères et contraintes UNIQUE sont automatiquement détectées.',
  },
]

const JSON_EXAMPLE = {
  entities: [
    {
      name: 'User',
      hasTimestamps: true,
      usesSoftDeletes: false,
      properties: [
        { propertyName: 'id',         typeName: 'Big Integer', isPrimaryKey: true,  autoIncrement: true,  isNullable: false },
        { propertyName: 'email',      typeName: 'String',      isPrimaryKey: false, autoIncrement: false, isNullable: false, isUnique: true },
        { propertyName: 'first_name', typeName: 'String',      isPrimaryKey: false, autoIncrement: false, isNullable: true  },
      ],
    },
    {
      name: 'Post',
      hasTimestamps: true,
      usesSoftDeletes: false,
      properties: [
        { propertyName: 'id',      typeName: 'Big Integer', isPrimaryKey: true,  autoIncrement: true,  isNullable: false },
        { propertyName: 'title',   typeName: 'String',      isPrimaryKey: false, autoIncrement: false, isNullable: false },
        { propertyName: 'content', typeName: 'Text',        isPrimaryKey: false, autoIncrement: false, isNullable: true  },
      ],
    },
  ],
  relationships: [
    {
      name: 'écrit',
      source: 'User',
      target: 'Post',
      sourceCardinality: '1,1',
      targetCardinality: '0,N',
    },
  ],
}


function downloadExample() {
  const blob = new Blob([JSON.stringify(JSON_EXAMPLE, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'modelize-me-example.json'
  a.click()
  URL.revokeObjectURL(url)
}

defineProps({
  menuItem: String,
})

const emit = defineEmits(['toggleDialog'])

const route = useRoute()


const { convertSQLToFlowElements, convertJSONToFlowElements } = useImport();
const mcdStore = useModelStore()
const collaborationStore = useCollaborationStore()

const isDragging = ref(false)
const file = ref(null)
const fileInput = ref(null)

const errorMessage = ref('')
const allowedFileTypes = ['.sql', '.json']
const isConvertingFile = ref(false)

const isJsonError = computed(() =>
  !!errorMessage.value && file.value?.name.toLowerCase().endsWith('.json')
)

const handleFile = async () => {
  isConvertingFile.value = true
  if (file.value) {
    try {
      const fileContent = await readFileAsText(file.value);
      const fileType = file.value.name.split('.').pop().toLowerCase();

      let nodes, edges;

      if (fileType === 'sql') {
        ({nodes, edges} = await convertSQLToFlowElements(fileContent, route.params.idModel));
      } else if (fileType === 'json') {
        ({nodes, edges} = await convertJSONToFlowElements(fileContent, route.params.idModel));
      }

      if (nodes && edges) {
        const existingNodes = mcdStore.flowMCD.getNodes ?? []
        const existingEdges = mcdStore.flowMCD.getEdges ?? []
        const allNodes = [...existingNodes, ...nodes]
        const allEdges = [...existingEdges, ...edges]

        // Layout all nodes (existing + imported) together
        const opts = computeElkOptions(allNodes, allEdges)
        const layouted = await getLayoutedElements(allNodes, allEdges, opts)
        if (!layouted) throw new Error('Layout failed')

        // Collision resolution pass (associations, loopbacks, cardinalities)
        let finalNodes = resolveCollisions(layouted.nodes, layouted.edges, { margin: 40 })

        // Sync to Yjs with skipTracking=true (origin='init') so UndoManager
        // treats this as the new baseline, then clear undo history.
        collaborationStore.setNodes(finalNodes, true);
        collaborationStore.setEdges(layouted.edges, true);
        useUndoRedoStore().clear();

        mcdStore.flowMCD.setNodes(finalNodes);
        mcdStore.flowMCD.setEdges(layouted.edges);

        await nextTick()
        mcdStore.flowMCD.fitView({ padding: 0.1, minZoom: 0.1 })
      }
    } catch (err) {
      errorMessage.value = err.message || 'Erreur lors de l\'importation du fichier.';
      console.error(err);
      isConvertingFile.value = false
      return
    }
  }
  isConvertingFile.value = false
  file.value = null
  emit('toggleDialog')
}

function readFileAsText(f) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(f);
  });
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
