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

  modules: [
    "shadcn-nuxt",
    "@nuxtjs/tailwindcss",
    "@prisma/nuxt",
    "@sidebase/nuxt-auth",
    '@pinia/nuxt',
    "nuxt-lucide-icons",
    'dayjs-nuxt',
    '@vee-validate/nuxt',
  ],

  vite: {
    optimizeDeps: {
      exclude: ['vee-validate']
    },
    resolve: {
      alias: {
        ".prisma/client/index-browser": "./node_modules/.prisma/client/index-browser.js"
      }
    }
  },

  dayjs: {
    locales: ['en', 'fr'],
    defaultLocale: 'fr',
    plugins: ['relativeTime', 'localizedFormat'],
  },

  runtimeConfig: {
    authSecret: 'oGDu}UC[pMovI1[c\'SLk+94bB3',
    authOrigin: '',
    baseURL: '',

    githubClientId: 'Ov23liTzb1cUucHiHKfs',
    githubClientSecret: 'c46bb3466b34cbe61e364a116672f38b6e7aca23',

    gitlabClientId: '26d187759235f890613b549e601bcf979fcf09a49478252d9984c1a6c4569bd2',
    gitlabClientSecret: 'gloas-90ea4e907fa6bf2c777419176b3f98b60730cf04100c4b45be25a551f01b71ae',

    googleClientId: '338068278224-buuu4bfkk6dvglc0h43a9ilkk7jh13k9.apps.googleusercontent.com',
    googleClientSecret: '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',

  },
  auth: {
    isEnabled: true,
    disableServerSideAuth: false,
    originEnvKey: process.env.NUXT_AUTH_ORIGIN || '',
    baseURL: process.env.NUXT_BASE_URL || '',
    provider: {
      type: 'authjs',
      trustHost: false,
      defaultProvider: 'google',
      addDefaultCallbackUrl: true
    },
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