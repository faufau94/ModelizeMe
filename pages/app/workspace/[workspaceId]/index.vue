<template>
  <div class="px-6 py-6 lg:px-8 max-w-5xl mx-auto w-full">
    <!-- Stats cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <NuxtLink :to="goToThisWorkspaceUrl('models')" class="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors cursor-pointer group">
        <div class="flex items-center gap-2 mb-3">
          <PanelTopIcon class="h-4 w-4 text-muted-foreground" />
          <p class="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Modèles</p>
        </div>
        <p class="text-3xl font-bold">{{ models?.length || 0 }}</p>
      </NuxtLink>
      <div class="rounded-xl border border-border bg-card p-5">
        <div class="flex items-center gap-2 mb-3">
          <UsersRound class="h-4 w-4 text-muted-foreground" />
          <p class="text-sm font-medium text-muted-foreground">Équipes</p>
        </div>
        <p class="text-3xl font-bold">{{ selectedWorkspace?.teams?.length || 0 }}</p>
      </div>
      <NuxtLink :to="goToThisWorkspaceUrl('members')" class="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors cursor-pointer group">
        <div class="flex items-center gap-2 mb-3">
          <Users class="h-4 w-4 text-muted-foreground" />
          <p class="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Membres</p>
        </div>
        <p class="text-3xl font-bold">{{ selectedWorkspace?.members?.length || 0 }}</p>
      </NuxtLink>
      <div v-if="lastModifiedModel" class="rounded-xl border border-border bg-card p-5">
        <div class="flex items-center gap-2 mb-3">
          <Clock class="h-4 w-4 text-muted-foreground" />
          <p class="text-sm font-medium text-muted-foreground">Dernier modifié</p>
        </div>
        <NuxtLink :to="`/app/model/${lastModifiedModel.id}`" class="text-md font-medium mt-3 truncate block hover:text-primary transition-colors" :title="lastModifiedModel.name">{{ lastModifiedModel.name || '-' }}</NuxtLink>
      </div>
      <div v-else class="rounded-xl border border-border bg-card p-5">
        <div class="flex items-center gap-2 mb-3">
          <Clock class="h-4 w-4 text-muted-foreground" />
          <p class="text-sm font-medium text-muted-foreground">Dernier modifié</p>
        </div>
        <p class="text-sm font-medium mt-1 truncate">-</p>
      </div>
    </div>

    <!-- Recent models -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold">Modèles récents</h2>
        <NuxtLink :to="goToThisWorkspaceUrl('models')" class="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Voir tout →
        </NuxtLink>
      </div>
      <div v-if="isLoadingModels" class="flex justify-center py-12">
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>
      <div v-else-if="recentModels?.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CardModel
          v-for="model in recentModels"
          :key="model.id"
          :model="model"
          :viewers="[]"
          :is-selected="false"
          :is-any-selected="false"
        />
      </div>
      <div v-else class="text-center py-12 text-sm text-muted-foreground">
        Aucun modèle pour le moment
      </div>
    </div>

    <!-- Teams overview -->
    <div v-if="selectedWorkspace?.teams?.length">
      <h2 class="text-sm font-semibold mb-4">Équipes</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="team in selectedWorkspace.teams" :key="team.id"
          class="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors group relative"
        >
          <NuxtLink
            :to="goToThisWorkspaceUrl('team/' + team.id)"
            class="block"
          >
            <div class="flex items-center gap-2.5 mb-3">
              <div class="w-3 h-3 rounded-full" :class="teamColorClass(team?.color)"></div>
              <span class="text-sm font-medium">{{ team.name }}</span>
            </div>
            <div class="flex items-center gap-4 text-xs text-muted-foreground">
              <span class="flex items-center gap-1">
                <Users class="h-3 w-3" />{{ team?.members?.length || 0 }} membre(s)
              </span>
              <span class="flex items-center gap-1">
                <PanelTopIcon class="h-3 w-3" />{{ team?.models?.length || 0 }} modèle(s)
              </span>
            </div>
          </NuxtLink>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                class="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-accent cursor-pointer"
                @click.prevent.stop
              >
                <MoreHorizontalIcon class="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-48">
              <DropdownMenuItem class="cursor-pointer" @click.stop="navigateTo(goToThisWorkspaceUrl('team/' + team.id))">
                <ExternalLink class="mr-2 h-4 w-4" />
                <span>Voir l'équipe</span>
              </DropdownMenuItem>
              <template v-if="getIsOwnerOrAdmin">
                <DropdownMenuSeparator />
                <DropdownMenuItem class="cursor-pointer text-destructive focus:text-destructive" @click.stop="removeTeam(team.id)">
                  <Trash2 class="mr-2 h-4 w-4" />
                  <span>Supprimer</span>
                </DropdownMenuItem>
              </template>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'sidebar',
})

import { computed } from 'vue'
import { PanelTopIcon, UsersRound, Users, Clock, Loader2, MoreHorizontalIcon, ExternalLink, Trash2 } from 'lucide-vue-next'
import { useModel } from "@/composables/api/useModel"
import { useWorkspace } from "@/composables/api/useWorkspace"
import { useTeam } from "@/composables/api/useTeam"
import { teamColorClass } from "~/utils"
import CardModel from "@/components/ui/card/CardModel.vue"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'vue-sonner'

const { models, isLoadingModels } = useModel()
const { selectedWorkspace, goToThisWorkspaceUrl, getIsOwnerOrAdmin } = useWorkspace()
const { deleteTeam } = useTeam()

const recentModels = computed(() => {
  if (!models.value?.length) return []
  return [...models.value]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6)
})

const lastModifiedModel = computed(() => {
  if (!models.value?.length) return null
  const sorted = [...models.value].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  return sorted[0] || null
})

async function removeTeam(teamId) {
  try {
    await deleteTeam(teamId)
    toast.success('Équipe supprimée')
  } catch (e) {
    toast.error('Erreur lors de la suppression')
  }
}
</script>
