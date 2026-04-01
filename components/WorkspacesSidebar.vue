<template>
    <div class="flex flex-col items-center gap-2">
      <div v-if="!isLoadingWorkspaces" class="flex flex-col items-center gap-1.5">
        <template v-for="workspace in workspaces" :key="workspace.id">
          <TooltipProvider :delay-duration="0">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button @click="switchWorkspaceUrl(workspace.id)" variant="outline" size="icon" 
                class="h-9 w-9 rounded-lg text-xs font-semibold transition-colors"
                :class="$route.params.workspaceId && $route.params.workspaceId === workspace?.id 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' 
                  : 'hover:bg-accent'">
                  {{ workspace?.name?.charAt(0).toLocaleUpperCase() }}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" class="text-xs">
                {{ workspace?.name }}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </template>
      </div>
    </div>
</template>

<script setup>
import { useWorkspace } from '@/composables/api/useWorkspace';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

const { workspaces, isLoadingWorkspaces, switchWorkspace } = useWorkspace()

const switchWorkspaceUrl = async (workspaceId) => {
  await switchWorkspace(workspaceId)
}
</script>