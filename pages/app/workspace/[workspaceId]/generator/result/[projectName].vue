<template>
  <div class="h-full flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto">
    <div class="w-full max-w-md space-y-4">

      <!-- Header -->
      <div class="text-center space-y-1 pb-2">
        <div class="flex justify-center mb-3">
          <div class="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 class="h-6 w-6 text-green-600 dark:text-green-400"/>
          </div>
        </div>
        <h1 class="text-2xl font-bold tracking-tight">Projet généré !</h1>
        <p class="text-muted-foreground text-base">Téléchargez le projet ou créez un dépôt distant.</p>
      </div>

      <!-- Download -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="text-base font-semibold flex items-center gap-2">
            <Package class="h-5 w-5 text-muted-foreground"/>
            Télécharger le projet
          </CardTitle>
          <CardDescription class="text-sm">Récupérez le projet complet au format ZIP.</CardDescription>
        </CardHeader>
        <CardContent class="pt-0">
          <Button size="lg" @click="downloadProject" class="w-full text-base" :disabled="isDownloading">
            <Loader2 v-if="isDownloading" class="w-5 h-5 mr-2 animate-spin"/>
            <Download v-else class="w-5 h-5 mr-2"/>
            {{ isDownloading ? 'Téléchargement...' : 'Télécharger le ZIP' }}
          </Button>
        </CardContent>
      </Card>

      <!-- Separator -->
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <span class="w-full border-t"/>
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-background px-2 text-muted-foreground">Ou</span>
        </div>
      </div>

      <!-- Git providers -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="text-base font-semibold flex items-center gap-2">
            <GitBranch class="h-5 w-5 text-muted-foreground"/>
            Créer un dépôt
          </CardTitle>
          <CardDescription class="text-sm">Poussez le projet sur un service Git.</CardDescription>
        </CardHeader>
        <CardContent class="pt-0 grid grid-cols-2 gap-3">
          <Button size="lg" @click="createRepoWithProvider('github')" variant="outline" class="w-full text-base">
            <Github class="w-5 h-5 mr-2"/>
            GitHub
          </Button>
          <Button size="lg" @click="createRepoWithProvider('gitlab')" variant="outline" class="w-full text-base">
            <Gitlab class="w-5 h-5 mr-2"/>
            GitLab
          </Button>
        </CardContent>
      </Card>

    </div>
  </div>
</template>

<script setup>
import {CheckCircle2, Download, GitBranch, Github, Gitlab, Loader2, Package} from 'lucide-vue-next'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '~/components/ui/card'
import {Button} from '~/components/ui/button'
import {authClient} from '~/lib/auth-client'

definePageMeta({
  layout: 'sidebar',
});

const route = useRoute()

const createRepoWithProvider = async (provider) => {
  try {
    // Check server-side if the user has a linked account for this provider
    const { linked } = await $fetch('/api/auth/linked-account', {
      query: { provider },
    });

    const basePath = `/app/workspace/${route.params.workspaceId}/generator/result`

    if (!linked) {
      // Redirect to OAuth flow to link the account
      await authClient.signIn.social({
        provider,
        callbackURL: `${basePath}/create-repo?provider=${provider}&projectName=${route.params.projectName}`,
      });
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
  if (_confettiTriggered) return
  _confettiTriggered = true
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

<script>
// Module-level flag: survives component unmount/remount within the same session
let _confettiTriggered = false
</script>
