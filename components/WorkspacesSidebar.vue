<template>
    <div class="w-16 border-r border-border bg-card flex flex-col items-center hidden md:flex">
      <div class="flex flex-col items-center space-y-4">
        <!-- Organization Logo -->
        
        <!-- Organization Selector - No Popover -->
        <div class="flex flex-col items-center space-y-3 mt-4">
          <!-- Simple button without dropdown -->
          <template v-for="workspace in workspaces" :key="workspace.id">
            <Button @click="switchWorkspaceUrl(workspace.id)" variant="outline" size="icon" 
            class="h-8 w-8 rounded-md"
            :class="$route.params.workspaceId && $route.params.workspaceId === workspace?.id ? 'ring-2 ring-primary ring-offset-2' : ''">
              <span class="font-medium text-xs"> {{ workspace?.name?.charAt(0).toLocaleUpperCase() }}</span>
            </Button>
          </template>
        </div>
        
        <!-- Add Organization Button -->
        <AddWorkspaceDialog :isOnlyIcon="true"/>
      </div>
    </div>
</template>

<script setup>
import { useWorkspace } from '@/composables/api/useWorkspace';

const { refresh } = useAuth()

// Composables
const { workspaces, switchWorkspace } = useWorkspace()

await refresh()

const switchWorkspaceUrl = async (workspaceId) => {
  await switchWorkspace(workspaceId)
}


</script>