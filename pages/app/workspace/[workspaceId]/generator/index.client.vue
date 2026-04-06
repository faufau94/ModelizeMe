<template>
  <div class="px-6 py-6 lg:px-8 max-w-5xl mx-auto w-full">
    <ClientOnly>
      <div v-if="isLoadingProjects" class="flex justify-center mt-32 items-center">
        <Loader2 :size="30" class="animate-spin"/>
      </div>
      <div v-else>
        <!-- Empty state -->
        <div v-if="isProjectsFetched && (!projects || projects.length === 0)">
          <div class="flex flex-col items-center justify-center py-24">
            <div class="rounded-full bg-muted p-4 mb-4">
              <FolderCode class="h-8 w-8 text-muted-foreground"/>
            </div>
            <h3 class="text-lg font-semibold tracking-tight">Aucun projet</h3>
            <p class="text-muted-foreground text-sm max-w-sm mx-auto text-center mt-1">
              Vous n'avez encore généré aucun projet. Générez-en un à partir d'un de vos modèles.
            </p>
            <div class="pt-4">
              <Button @click="goToNewProject">
                <Plus class="w-4 h-4 mr-2"/>
                Générer un projet
              </Button>
            </div>
          </div>
        </div>

        <!-- Project list -->
        <div v-else>
          <div class="flex items-center justify-between mb-5">
            <div class="relative w-full max-w-sm">
              <Input v-model="searchTerm" type="text" placeholder="Rechercher un projet..." class="bg-white dark:bg-card pl-10"/>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
                <Search class="size-4 text-muted-foreground"/>
              </span>
            </div>
            <Button @click="goToNewProject">
              <Plus class="w-4 h-4 mr-2"/>
              Générer un projet
            </Button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card
              v-for="project in filteredProjects"
              :key="project.id"
              class="group hover:shadow-md transition-shadow cursor-pointer"
              @click="goToResult(project.name)"
            >
              <CardHeader class="pb-3">
                <div class="flex items-start justify-between">
                  <div class="min-w-0 flex-1">
                    <CardTitle class="text-sm font-semibold truncate">{{ project.name }}</CardTitle>
                    <CardDescription v-if="project.description" class="text-xs mt-1 line-clamp-2">
                      {{ project.description }}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child @click.stop>
                      <Button variant="ghost" size="icon" class="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical class="h-4 w-4"/>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click.stop="goToResult(project.name)">
                        <Download class="h-4 w-4 mr-2"/>
                        Télécharger / Dépôt
                      </DropdownMenuItem>
                      <DropdownMenuSeparator/>
                      <DropdownMenuItem @click.stop="confirmDelete(project)" class="text-destructive focus:text-destructive">
                        <Trash2 class="h-4 w-4 mr-2"/>
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent class="pt-0">
                <div class="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="secondary" class="text-xs gap-1">
                    <Avatar class="h-3.5 w-3.5">
                      <AvatarImage class="p-0.5" :src="`/logos/${project.framework}.svg`" :alt="project.framework"/>
                    </Avatar>
                    {{ formatLabel(project.framework) }}
                  </Badge>
                  <Badge variant="outline" class="text-xs">{{ formatLabel(project.orm) }}</Badge>
                  <Badge variant="outline" class="text-xs">{{ formatLabel(project.database) }}</Badge>
                </div>
                <div class="flex items-center justify-between text-xs text-muted-foreground">
                  <span v-if="project.model" class="truncate">
                    Modèle : {{ project.model.name }}
                  </span>
                  <span class="shrink-0">{{ formatDate(project.createdAt) }}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClientOnly>

    <!-- Delete confirmation dialog -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le projet <span class="font-medium">{{ projectToDelete?.name }}</span> sera supprimé définitivement.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction @click="handleDelete" :disabled="isDeletingProject" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            <Loader2 v-if="isDeletingProject" class="w-4 h-4 mr-2 animate-spin"/>
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Loader2, Plus, Search, FolderCode, MoreVertical, Download, Trash2 } from 'lucide-vue-next'
import { useProject } from '@/composables/api/useProject'
import { toast } from 'vue-sonner'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'

definePageMeta({
  layout: 'sidebar',
})

const route = useRoute()
const { projects, isLoadingProjects, isProjectsFetched, deleteProject, isDeletingProject } = useProject()

const searchTerm = ref('')
const showDeleteDialog = ref(false)
const projectToDelete = ref(null)

const filteredProjects = computed(() => {
  if (!projects.value) return []
  if (!searchTerm.value) return projects.value
  const term = searchTerm.value.toLowerCase()
  return projects.value.filter(p =>
    p.name.toLowerCase().includes(term) ||
    p.framework.toLowerCase().includes(term) ||
    p.model?.name?.toLowerCase().includes(term)
  )
})

const goToNewProject = () => {
  navigateTo(`/app/workspace/${route.params.workspaceId}/generator/new`)
}

const goToResult = (projectName) => {
  navigateTo(`/app/workspace/${route.params.workspaceId}/generator/result/${projectName}`)
}

const confirmDelete = (project) => {
  projectToDelete.value = project
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  try {
    await deleteProject(projectToDelete.value.id)
    toast.success('Projet supprimé')
    showDeleteDialog.value = false
    projectToDelete.value = null
  } catch (error) {
    toast.error('Erreur lors de la suppression')
  }
}

const formatLabel = (value) => {
  const labels = {
    django: 'Django', laravel: 'Laravel', nuxt: 'Nuxt.js',
    django_orm: 'Django ORM', sqlalchemy: 'SQLAlchemy', eloquent: 'Eloquent',
    prisma: 'Prisma', typeorm: 'TypeORM', doctrine: 'Doctrine',
    postgresql: 'PostgreSQL', mysql: 'MySQL', sqlite: 'SQLite',
  }
  return labels[value] || value
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>
