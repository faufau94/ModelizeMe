<script setup lang="ts">
import UiMeteors from '@/components/UiMeteors.client.vue'
//import UiRetroGrid from '@/components/RetroGrid.vue'

const {data, signOut} = useAuth()
</script>

<template>
  <div class="flex flex-col min-h-[100dvh]">
    <header class="px-4 lg:px-6 h-14 flex items-center justify-between">
      <NuxtLink class="flex items-center" to="/">
        <span class="text-xl font-bold ml-2">ModelizeMe</span>
      </NuxtLink>
      <div v-if="!data" class="flex gap-4">
        <NuxtLink
            to="/sign-in">
          <Button
              variant="outline"
              to="/sign-in"
          >
            Se connecter
          </Button>
        </NuxtLink>

        <NuxtLink
            to="/sign-up"
        >
          <Button>
            S'inscrire
          </Button>
        </NuxtLink>
      </div>
      <div v-else class="flex gap-4">
        <Button
            variant="outline"
            @click="() => signOut({ callbackUrl: '/' })"
            class="inline-flex h-9 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium text-black shadow-sm transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          Se déconnecter
        </Button>
      </div>
    </header>
    <main class="flex-1 flex items-center justify-center px-4 md:px-6">

      <div
          class="relative mx-auto flex items-center justify-center overflow-hidden p-52"
      >
        <div class="max-w-6xl text-center space-y-4">
        <client-only>
          <UiMeteors :number="10"/>
          <!--<UiRetroGrid />-->
        </client-only>
          <h1 class="text-5xl font-bold tracking-tighter sm:text-7xl">
            Modélisez. Générez. Profitez.
          </h1>
          <p class="text-muted-foreground text-sm md:text-lg max-w-3xl mx-auto">
            Modélisez vos bases de données en toute simplicité, en tenant compte de chaque détail. Générez
            automatiquement le code adapté à vos besoins et commencez à coder sans perdre de temps.
          </p>
        </div>
      </div>

      <!--

      -->
    </main>
    <footer class="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
      <p class="text-xs text-muted-foreground">© {{ new Date().getFullYear() }} ModelizeMe. Tous droits réservés.</p>
      <nav class="sm:ml-auto flex gap-4 sm:gap-6">
        <a class="text-xs hover:underline underline-offset-4" href="#"></a>
      </nav>
    </footer>
  </div>

</template>