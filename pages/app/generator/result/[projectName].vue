<template>
  <div class="flex flex-col justify-center items-center min-h-screen md:p-6 lg:p-8">
    <div class="max-w-3xl">
      <div class="space-y-2 mx-auto">
        <h1 class="text-3xl font-semibold">Génial ! Le projet a été généré ! 🤩</h1>
        <p class="text-gray-500 max-w-md text-center">Tu peux désormais soit créer un dépôt du projet, soit le
          télécharger directement.</p>
      </div>
      <div class="flex flex-col mx-auto gap-y-10 mt-4">
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Télécharger le projet</CardTitle>
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

        <Separator label="Ou"/>

        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Créer un dépot du projet</CardTitle>
            <CardDescription>Choisis le service où tu souhaites créer le dépôt.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <Button @click="createRepoWithProvider('github')" variant="outline" class="w-full">
              <Github class="mr-2 h-4 w-4"/>
              GitHub
            </Button>
            <Button @click="createRepoWithProvider('gitlab')" variant="outline" class="w-full">
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
import {Download, Loader2, Github, Gitlab} from 'lucide-vue-next'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '~/components/ui/card'
import {Button} from '~/components/ui/button'
import {Separator} from '@/components/ui/separator'
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'sidebar',
});


const route = useRoute()
const { signIn, token, getSession } = useAuth();

const isProviderLinked = async (userId, provider) => {
  return await $fetch('/api/helper/is-provider-linked', {
    method: 'POST',
    body: {
      userId,
      provider,
    },
  });
};


const createRepoWithProvider = async (provider) => {
  try {

    // Récupérer la session actuelle de l'utilisateur
    const session = await getSession();

    // Vérifier si l'utilisateur a déjà lié son compte GitHub
    const linkedAccount = session?.user?.accounts?.find(acc => acc.provider === 'github');

    if(linkedAccount === undefined || !linkedAccount) {
      await signIn(provider, { callbackUrl: `/app/generator/result/create-repo?provider=${provider}&projectName=${route.params.projectName}` });
    } else {
      await navigateTo({
        path: '/app/generator/result/create-repo',
        query: {
          provider: provider,
          projectName: route.params.projectName,
        }
      })
    }

    // Vérifier si le compte est déjà lié avec ce provider (GitHub ou GitLab)
   // const accountLinked = await isProviderLinked(userId, provider); // Fonction à implémenter
/*
    if (!accountLinked) {
      // Si le compte n'est pas encore lié, lancer la connexion avec le provider
      await signIn(provider);

      // Une fois connecté, enregistrer manuellement le compte
      const accountData = {
        provider,
        providerAccountId: token.value.providerAccountId, // Récupérer l'ID du provider
        userId,
        accessToken: token.value.accessToken, // Enregistrer le token ou autres informations
      };

      console.log('accountData', accountData);
      // // Enregistrer le compte dans la base de données
      // await $fetch('/api/account/link', {
      //   method: 'POST',
      //   body: accountData,
      // });

      toast({
        title: 'Compte lié',
        message: `Votre compte ${provider} a été lié avec succès.`,
        type: 'success',
      });
    }

    // Créer le dépôt sur GitHub ou GitLab
    const response = await $fetch('/api/generator/create-repo', {
      method: 'POST',
      body: {
        projectName: route.params.projectName,
        provider,
        token: token.value,
      },
    });

    if (response.error) {
      toast({
        title: 'Erreur',
        message: response.error,
        type: 'error',
      });
    } else {
      toast({
        title: 'Succès',
        message: `Le dépôt a été créé avec succès sur ${provider === 'github' ? 'GitHub' : 'GitLab'}.`,
        type: 'success',
      });
    }

 */
  } catch (error) {
    console.error('Erreur lors de la création du dépôt', error);
    
  }
};

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
  const blob = new Blob([response], {type: 'application/zip'});
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
const hasTriggeredConfetti = ref(false);
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

  if(!hasTriggeredConfetti.value) {
    triggerConfetti();
    hasTriggeredConfetti.value = true;
  }
})
</script>
