// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  components: [
        {
            path: '~/components',
            pathPrefix: false,
            ignore: ['**/index.*']
        }
  ],

  plugins: [
    '~/plugins/vue-query.ts',
  ],

  modules: [
    "shadcn-nuxt",
    "@nuxtjs/tailwindcss",
    '@pinia/nuxt',
    "nuxt-lucide-icons",
    'dayjs-nuxt',
    '@vee-validate/nuxt',
    //'@nuxtjs/i18n'
  ],

  vite: {
    optimizeDeps: {
      include: ["zod"],
      exclude: ['vee-validate']
    },
    resolve: {
      alias: {
        ".prisma/client/index-browser": "./node_modules/.prisma/client/index-browser.js"
      }
    },
    ssr: {
      noExternal: [
        '@prisma/client',
        'prisma',
        'better-auth',
        'better-auth/adapters/prisma'
      ]
    }
  },

  dayjs: {
    locales: ['en', 'fr'],
    defaultLocale: 'fr',
    plugins: ['relativeTime', 'localizedFormat'],
  },

  runtimeConfig: {
    public: {
      baseUrl: process.env.BASE_URL,
    },
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

  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },
})
