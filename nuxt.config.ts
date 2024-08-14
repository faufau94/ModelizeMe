// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: ["shadcn-nuxt", "@nuxtjs/tailwindcss", "@prisma/nuxt", "@sidebase/nuxt-auth", '@pinia/nuxt',],

  runtimeConfig: {
    authSecret: 'oGDu}UC[pMovI1[c\'SLk+94bB3',
    authOrigin: 'http://localhost:3000',

    githubClientId: 'Ov23liTzb1cUucHiHKfs',
    githubClientSecret: 'c46bb3466b34cbe61e364a116672f38b6e7aca23',

    googleClientId: '338068278224-buuu4bfkk6dvglc0h43a9ilkk7jh13k9.apps.googleusercontent.com',
    googleClientSecret: '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',

  },
  auth: {
    isEnabled: true,
    disableServerSideAuth: false,
    originEnvKey: 'AUTH_ORIGIN',
    baseURL: 'http://localhost:3000/api/auth',
    provider: {
      type: 'authjs',
      trustHost: false,
      defaultProvider: 'google',
      addDefaultCallbackUrl: true
    }
  },

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui'
  }
})