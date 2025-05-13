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
    authSecret: process.env.AUTH_SECRET,
    authOrigin: process.env.NUXT_AUTH_ORIGIN,
    baseURL: process.env.NUXT_BASE_URL,

    githubClientId: process.env.GITHUB_CLIENT_ID,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,

    gitlabClientId: process.env.GITLAB_CLIENT_ID,
    gitlabClientSecret: process.env.GITLAB_CLIENT_SECRET,

    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,

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