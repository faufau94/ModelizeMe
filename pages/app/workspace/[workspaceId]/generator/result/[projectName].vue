<template>
  <div class="flex flex-col justify-center items-center min-h-screen p-6">
    <div class="w-full max-w-lg space-y-8">
      <div class="text-center space-y-2">
        <h1 class="text-2xl font-bold tracking-tight">Projet généré avec succès !</h1>
        <p class="text-muted-foreground text-sm">
          Téléchargez le projet ou créez un dépôt distant.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle class="text-base">Télécharger le projet</CardTitle>
          <CardDescription>Récupérez le projet complet au format ZIP.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button @click="downloadProject" class="w-full" :disabled="isDownloading">
            <Loader2 v-if="isDownloading" class="w-4 h-4 mr-2 animate-spin"/>
            <Download v-else class="w-4 h-4 mr-2"/>
            {{ isDownloading ? 'Téléchargement...' : 'Télécharger le ZIP' }}
          </Button>
        </CardContent>
      </Card>

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <span class="w-full border-t"/>
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-background px-2 text-muted-foreground">Ou</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle class="text-base">Créer un dépôt</CardTitle>
          <CardDescription>Poussez le projet sur un service Git.</CardDescription>
        </CardHeader>
        <CardContent class="grid grid-cols-2 gap-3">
          <Button @click="createRepoWithProvider('github')" variant="outline">
            <Github class="w-4 h-4 mr-2"/>
            GitHub
          </Button>
          <Button @click="createRepoWithProvider('gitlab')" variant="outline">
            <Gitlab class="w-4 h-4 mr-2"/>
            GitLab
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import {Download, Github, Gitlab, Loader2} from 'lucide-vue-next'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '~/components/ui/card'
import {Button} from '~/components/ui/button'

definePageMeta({
  layout: 'sidebar',
});

const route = useRoute()
const {signIn, getSession} = useAuth();

const createRepoWithProvider = async (provider) => {
  try {
    const session = await getSession();
    const linkedAccount = session?.user?.accounts?.find(acc => acc.provider === provider);

    const basePath = `/app/workspace/${route.params.workspaceId}/generator/result`

    if (!linkedAccount) {
      await signIn(provider, {callbackUrl: `${basePath}/create-repo?provider=${provider}&projectName=${route.params.projectName}`});
    } else {
      await navigateTo({
        path: `${basePath}/create-repo`,
        query: {
          provider,
          projectName: route.params.projectName,
        }
      })
    }
  } catch (error) {
    console.error('Erreur lors de la redirection:', error);
  }
};

const isDownloading = ref(false)
const downloadProject = async () => {
  isDownloading.value = true

  try {
    const response = await $fetch('/api/generator/download', {
      method: 'POST',
      body: {projectName: route.params.projectName},
      responseType: 'blob',
    });

    const blob = new Blob([response], {type: 'application/zip'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${route.params.projectName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erreur téléchargement:', error);
  } finally {
    isDownloading.value = false
  }
}

const hasTriggeredConfetti = ref(false);
onMounted(() => {
  if (hasTriggeredConfetti.value) return
  hasTriggeredConfetti.value = true

  const colors = ["#bb0000", "#0000ee"];
  const end = Date.now() + 4 * 1000;

  function frame() {
    useConfetti({particleCount: 2, angle: 60, spread: 55, origin: {x: 0}, colors});
    useConfetti({particleCount: 2, angle: 120, spread: 55, origin: {x: 1}, colors});
    if (Date.now() < end) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})
</script>
