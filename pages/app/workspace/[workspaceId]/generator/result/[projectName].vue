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
          <Button size="lg" @click="openRepoDialog('github')" variant="outline" class="w-full text-base" :disabled="!!isCheckingProvider">
            <Loader2 v-if="isCheckingProvider === 'github'" class="w-5 h-5 mr-2 animate-spin"/>
            <Github v-else class="w-5 h-5 mr-2"/>
            GitHub
          </Button>
          <Button size="lg" @click="openRepoDialog('gitlab')" variant="outline" class="w-full text-base" :disabled="!!isCheckingProvider">
            <Loader2 v-if="isCheckingProvider === 'gitlab'" class="w-5 h-5 mr-2 animate-spin"/>
            <Gitlab v-else class="w-5 h-5 mr-2"/>
            GitLab
          </Button>
        </CardContent>
      </Card>

    </div>

    <!-- Create Repo Dialog -->
    <CreateRepoDialog
      v-model="isRepoDialogOpen"
      :provider="selectedProvider"
      :project-name="repoProjectName"
      :generated-project-name="String(route.params.projectName)"
      :auto-submit="autoSubmitRepo"
      @success="onRepoCreated"
    />
  </div>
</template>

<script setup>
import {CheckCircle2, Download, GitBranch, Github, Gitlab, Loader2, Package} from 'lucide-vue-next'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '~/components/ui/card'
import {Button} from '~/components/ui/button'
import {authClient} from '~/lib/auth-client'
import {toast} from 'vue-sonner'

definePageMeta({
  layout: 'sidebar',
});

const route = useRoute()
const router = useRouter()

const isRepoDialogOpen = ref(false)
const selectedProvider = ref('github')
const cleanProjectName = String(route.params.projectName).replace(/_project_.*$/, '')
const repoProjectName = ref(cleanProjectName)
const autoSubmitRepo = ref(false)
const isCheckingProvider = ref(null) // 'github' | 'gitlab' | null

const openRepoDialog = async (provider) => {
  isCheckingProvider.value = provider
  try {
    const { linked } = await $fetch('/api/auth/linked-account', { query: { provider } })

    if (!linked) {
      // Redirect to OAuth linking before showing the form
      const callbackURL = `${route.path}?linkProvider=${provider}&repoName=${cleanProjectName}`
      await authClient.linkSocial({ provider, callbackURL })
      // Browser redirects — execution stops here
      return
    }

    // Account already linked — open form directly
    selectedProvider.value = provider
    repoProjectName.value = cleanProjectName
    autoSubmitRepo.value = false
    isRepoDialogOpen.value = true
  } catch {
    toast.error('Impossible de vérifier votre compte. Réessayez.')
  } finally {
    isCheckingProvider.value = null
  }
}

const onRepoCreated = () => {
  // Nothing extra needed — dialog handles success state
}

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

onMounted(() => {
  // After OAuth redirect: auto-open dialog and submit with saved form values
  if (route.query.linkProvider) {
    const provider = String(route.query.linkProvider)
    const repoName = route.query.repoName ? String(route.query.repoName) : cleanProjectName

    // Clean query params
    router.replace({ query: {} })

    selectedProvider.value = provider
    repoProjectName.value = repoName
    autoSubmitRepo.value = true
    isRepoDialogOpen.value = true
    return
  }

  // Confetti only when arriving from the generation wizard
  if (route.query.generated !== '1') return
  router.replace({ query: {} })

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
