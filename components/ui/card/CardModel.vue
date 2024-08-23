<template>
  <Card class="cursor-pointer hover:border-gray-300 hover:shadow-md duration-150 transition">
    <CardHeader class="flex flex-row items-start gap-4 space-y-0">
      <div class="space-y-1 flex-1">
        <CardTitle class="text-lg">{{ props.model.title }}</CardTitle>
        <CardDescription>
          {{ props.model.description }}
        </CardDescription>
      </div>
      <div class="rounded-md text-secondary-foreground">
        <Button variant="secondary" class="p-2 shadow-none bg-white">
          <Trash2 :size="17" class="text-red-500" />
        </Button>
        <!--
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="secondary" class="px-2 shadow-none bg-white">
              <EllipsisVertical :size="15" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
              align="end"
              :align-offset="-5"
              class="w-[200px]"
          >
            <DropdownMenuCheckboxItem class="text-red-500">
              Supprimer
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        -->
      </div>
    </CardHeader>
    <CardContent>
      <div class="flex space-x-4 text-sm text-muted-foreground">
        <div class="flex items-center">
          <Circle class="mr-1 h-3 w-3 text-sky-400" />
          TypeScript
        </div>
        <div class="flex items-center">
          <Star class="mr-1 h-3 w-3" />
          20k
        </div>
        <div>Updated April 2023</div>
      </div>
    </CardContent>
  </Card>
</template>
<script setup lang="ts">
import { Trash2, Circle, Star } from 'lucide-vue-next';


const props = defineProps({
  model: {
    type: Object,
    required: true,
  },
});
</script>
