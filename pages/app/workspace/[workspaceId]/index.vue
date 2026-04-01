<template>
  <div class="px-6 py-6 lg:px-8 max-w-5xl mx-auto w-full">
    <!-- Stats cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="rounded-xl border border-border bg-card p-4">
        <div class="flex items-center gap-2 mb-2">
          <div class="rounded-md bg-primary/10 p-1.5">
            <PanelTopIcon class="h-4 w-4 text-primary" />
          </div>
          <p class="text-xs font-medium text-muted-foreground">Modèles</p>
        </div>
        <p class="text-2xl font-bold">{{ models?.length || 0 }}</p>
      </div>
      <div class="rounded-xl border border-border bg-card p-4">
        <div class="flex items-center gap-2 mb-2">
          <div class="rounded-md bg-primary/10 p-1.5">
            <UsersRound class="h-4 w-4 text-primary" />
          </div>
          <p class="text-xs font-medium text-muted-foreground">Équipes</p>
        </div>
        <p class="text-2xl font-bold">{{ selectedWorkspace?.teams?.length || 0 }}</p>
      </div>
      <div class="rounded-xl border border-border bg-card p-4">
        <div class="flex items-center gap-2 mb-2">
          <div class="rounded-md bg-primary/10 p-1.5">
            <Users class="h-4 w-4 text-primary" />
          </div>
          <p class="text-xs font-medium text-muted-foreground">Membres</p>
        </div>
        <p class="text-2xl font-bold">{{ selectedWorkspace?.members?.length || 0 }}</p>
      </div>
      <div class="rounded-xl border border-border bg-card p-4">
        <div class="flex items-center gap-2 mb-2">
          <div class="rounded-md bg-primary/10 p-1.5">
            <Clock class="h-4 w-4 text-primary" />
          </div>
          <p class="text-xs font-medium text-muted-foreground">Dernier modifié</p>
        </div>
        <p class="text-sm font-medium mt-1 truncate">{{ lastModifiedName }}</p>
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
        <NuxtLink
          v-for="team in selectedWorkspace.teams" :key="team.id"
          :to="goToThisWorkspaceUrl('team/' + team.id)"
          class="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
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
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'sidebar',
})

import { computed } from 'vue'
import { PanelTopIcon, UsersRound, Users, Clock, Loader2 } from 'lucide-vue-next'
import { useModel } from "@/composables/api/useModel"
import { useWorkspace } from "@/composables/api/useWorkspace"
import { teamColorClass } from "~/utils"
import CardModel from "@/components/ui/card/CardModel.vue"

const { models, isLoadingModels } = useModel()
const { selectedWorkspace, goToThisWorkspaceUrl } = useWorkspace()

const recentModels = computed(() => {
  if (!models.value?.length) return []
  return [...models.value]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6)
})

const lastModifiedName = computed(() => {
  if (!models.value?.length) return '—'
  const sorted = [...models.value].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  return sorted[0]?.name || '—'
})
</script>
