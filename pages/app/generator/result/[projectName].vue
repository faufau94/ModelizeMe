<template>
  <div class="flex flex-col justify-center items-center min-h-screen md:p-6 lg:p-8">
    <div class="max-w-3xl">
      <div class="space-y-2 mx-auto">
        <h1 class="text-3xl font-semibold">Génial ! Le projet a été généré ! 🤩</h1>
        <p class="text-gray-500 max-w-md text-center">Tu peux désormais soit créer un dépôt du projet, soit le
          télécharger directement.</p>
      </div>
      <div class="flex flex-col mx-auto gap-y-10 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Télécharger le projet</CardTitle>
            <CardDescription>Clique sur le bouton pour télécharger le projet entier.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button @click="downloadProject" class="w-full">
              <Loader2 v-if="isDownloading" class="w-4 h-4 mr-2 animate-spin"/>
              <Download v-if="!isDownloading" class="mr-2 h-4 w-4"/>
              {{ isDownloading ? 'Téléchargement...' : 'Télécharger le projet' }}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Créer un dépot du projet</CardTitle>
            <CardDescription>Choisis le service où tu souhaites créer le dépôt.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <Button variant="outline" class="w-full">
              <Github class="mr-2 h-4 w-4"/>
              GitHub
            </Button>
            <Button variant="outline" class="w-full">
              <Gitlab class="mr-2 h-4 w-4"/>
              GitLab
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>

</template>

<script setup>

definePageMeta({
  layout: 'sidebar',
});

import {Download, Loader2, Github, Gitlab} from 'lucide-vue-next'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '~/components/ui/card'
import {Button} from '~/components/ui/button'

const route = useRoute()

const isDownloading = ref(false)

const downloadProject = async () => {
  isDownloading.value = true

  const response = await $fetch('/api/generator/download', {
    method: 'POST',
    body: {
      projectName: route.params.projectName,
    },
  });

  // Créer une URL Object pour le blob
  const blob = new Blob([response], { type: 'application/zip' });
  const url = window.URL.createObjectURL(blob);

  // Créer un élément <a> pour télécharger le fichier
    const a = document.createElement('a');
    a.href = url;
    a.download = `${route.params.projectName}.zip`; // Nom du fichier à télécharger

  // Ajouter le lien au document et simuler un clic
    document.body.appendChild(a);
    a.click();

  // Nettoyer le document
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    isDownloading.value = false
  }

onMounted(() => {
  const triggerConfetti = () => {
    const colors = ["#bb0000", "#0000ee"];
    const end = Date.now() + 5 * 1000;

    function frame() {
      useConfetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: {x: 0},
        colors: colors,
      });
      useConfetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: {x: 1},
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }

    requestAnimationFrame(frame);
  };

  triggerConfetti();
})
</script>
