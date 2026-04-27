<script setup lang="ts">
import {
  ArrowRight,
  Check,
  Database,
  Download,
  Github,
  Layers,
  MessageSquare,
  Moon,
  Play,
  Shield,
  Sparkles,
  Sun,
  Users,
  Workflow,
  X,
} from 'lucide-vue-next'
import { signOut, useSession } from '~/lib/auth-client'
import { useThemeTransition } from '~/composables/useThemeTransition'

const { data } = await useSession(useFetch)

const { colorMode, setTheme } = useThemeTransition()

const toggleTheme = (e: MouseEvent) => {
  setTheme(colorMode.value === 'dark' ? 'light' : 'dark', e)
}

const activeTab = ref<'mcd' | 'mld' | 'mpd'>('mcd')

const tabContent = {
  mcd: {
    dotColor: 'bg-blue-500',
    entityColor: 'blue-500',
    entities: [
      { name: 'USER', rows: [['🔑 id', 'int'], ['email', 'varchar'], ['name', 'varchar']] },
      { name: 'PRODUCT', rows: [['🔑 id', 'int'], ['title', 'varchar'], ['price', 'decimal']] },
      { name: 'ADDRESS', rows: [['🔑 id', 'int'], ['line1', 'varchar'], ['city', 'varchar']] },
    ],
    center: { name: 'ORDER', rows: [['🔑 id', 'int'], ['status', 'enum'], ['total', 'decimal']] },
  },
  mld: {
    dotColor: 'bg-emerald-500',
    entityColor: 'emerald-500',
    entities: [
      { name: 'user', rows: [['🔑 id', 'int'], ['email', 'varchar'], ['name', 'varchar']] },
      { name: 'product', rows: [['🔑 id', 'int'], ['title', 'varchar'], ['price', 'decimal']] },
      { name: 'address', rows: [['🔑 id', 'int'], ['user_id (FK)', 'int'], ['line1', 'varchar']] },
    ],
    center: { name: 'order', rows: [['🔑 id', 'int'], ['user_id (FK)', 'int'], ['total', 'decimal']] },
  },
  mpd: {
    dotColor: 'bg-purple-500',
    entityColor: 'purple-500',
    entities: [
      { name: 'user', rows: [['🔑 id', 'BIGINT'], ['email', 'VARCHAR(255)'], ['created_at', 'TIMESTAMP']] },
      { name: 'product', rows: [['🔑 id', 'BIGINT'], ['title', 'VARCHAR(120)'], ['price', 'DECIMAL']] },
      { name: 'address', rows: [['🔑 id', 'BIGINT'], ['user_id', 'BIGINT'], ['city', 'VARCHAR(80)']] },
    ],
    center: { name: 'order', rows: [['🔑 id', 'BIGINT'], ['user_id', 'BIGINT'], ['total', 'DECIMAL(10,2)']] },
  },
} as const

const currentTab = computed(() => tabContent[activeTab.value])

const frameworks = [
  { name: 'Django', soon: false },
  { name: 'Laravel', soon: false },
  { name: 'Nuxt', soon: false },
  { name: 'Next.js', soon: true },
  { name: 'Symfony', soon: true },
  { name: 'Rails', soon: true },
  { name: 'Spring Boot', soon: true },
]
const orms = ['Prisma', 'TypeORM', 'SQLAlchemy', 'Doctrine', 'Eloquent', 'Django ORM']
const databases = ['MySQL', 'PostgreSQL', 'SQLite']

const features = [
  {
    icon: Workflow,
    title: 'Pipeline Merise complet',
    description:
      'MCD → MLD → MPD avec dérivation automatique. Tables de jonction, snake_case, types SQL, timestamps, tout reste synchronisé de bout en bout.',
  },
  {
    icon: Users,
    title: 'Collaboration temps réel',
    description:
      'Curseurs live, édition simultanée et synchronisation sans conflit grâce à Yjs CRDT. Hors-ligne, merge à la reconnexion.',
  },
  {
    icon: Sparkles,
    title: 'Génération multi-stack',
    description:
      'Exportez migrations, modèles ORM et structure de projet. 3 frameworks déjà supportés, 6 ORM, 3 bases, et plus arrivent.',
  },
  {
    icon: Download,
    title: 'Import universel',
    description:
      'Collez du SQL DDL depuis MySQL, Postgres, SQLite ou SQL Server. On parse, on layout, on type-infère chaque colonne.',
  },
  {
    icon: Layers,
    title: 'Auto-layout intelligent',
    description:
      'ELK.js + résolveur de collisions en spirale. Glissez une entité, chaque node trouve sa place sans écraser les voisins.',
  },
  {
    icon: Shield,
    title: 'Open source & self-hostable',
    description:
      'Licence MIT, Docker Compose clé en main. Vos données restent sur votre machine, votre VPS, où vous voulez.',
  },
]

const steps = [
  {
    num: '01',
    title: 'Modélise',
    description: 'Déposez des entités sur le canvas, reliez-les avec des cardinalités, laissez la grille faire le reste.',
    accent: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-500/10 dark:bg-blue-400/10',
  },
  {
    num: '02',
    title: 'Dérive',
    description: 'Un clic : le MCD devient MLD devient MPD. Les tables de jonction se matérialisent, les types se figent.',
    accent: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
  },
  {
    num: '03',
    title: 'Génère',
    description: 'Choisissez framework, ORM, base. Téléchargez le ZIP ou poussez directement vers un nouveau repo GitHub ou GitLab.',
    accent: 'text-purple-500 dark:text-purple-400',
    bg: 'bg-purple-500/10 dark:bg-purple-400/10',
  },
]

const plans = [
  {
    name: 'Self-host',
    price: '0€',
    period: 'à vie',
    tagline: 'Toutes les fonctionnalités, sur vos machines.',
    cta: 'Voir le guide Docker',
    featured: false,
    features: [
      { label: 'Tout, sans aucune limite', included: true },
      { label: 'Vos données restent chez vous', included: true },
      { label: 'Licence MIT, forkable', included: true },
      { label: 'Docker Compose en 30 secondes', included: true },
      { label: 'À vous de gérer l\'infra', included: true },
    ],
  },
  {
    name: 'Cloud Free',
    price: '0€',
    period: '/mois',
    tagline: 'Pour découvrir sans installer quoi que ce soit.',
    cta: 'Créer un compte',
    featured: false,
    features: [
      { label: '3 modèles actifs', included: true },
      { label: 'Pipeline MCD → MLD → MPD', included: true },
      { label: 'Export PNG / SVG / JSON', included: true },
      { label: 'Import depuis SQL', included: true },
      { label: 'Génération de code', included: false },
      { label: 'Collaboration d\'équipe', included: false },
    ],
  },
  {
    name: 'Cloud Pro',
    price: '9€',
    period: '/mois',
    tagline: 'Pour les indépendants qui veulent zéro infra.',
    cta: 'Commencer',
    featured: true,
    features: [
      { label: 'Modèles illimités', included: true },
      { label: 'Génération de code complète', included: true },
      { label: 'Push vers GitHub & GitLab', included: true },
      { label: 'Sauvegardes automatiques', included: true },
      { label: 'Maintenance & mises à jour gérées', included: true },
    ],
  },
  {
    name: 'Cloud Team',
    price: '19€',
    period: '/siège',
    tagline: 'Pour les équipes qui modélisent ensemble.',
    cta: 'Rejoindre la beta',
    featured: false,
    features: [
      { label: 'Tout Cloud Pro', included: true },
      { label: 'Workspaces & équipes', included: true },
      { label: 'Collaboration temps réel', included: true },
      { label: 'Permissions par rôle', included: true },
      { label: 'Invitations illimitées', included: true },
    ],
  },
]

const activeCodeTab = ref<'prisma' | 'sql' | 'typescript'>('prisma')

type CodeLine = {
  type: string
  text?: string
  name?: string
  flagged?: string
  ttype?: string
  suffix?: string
}

const codeSamples: Record<'prisma' | 'sql' | 'typescript', { label: string; lines: CodeLine[] }> = {
  prisma: {
    label: 'schema.prisma',
    lines: [
      { type: 'comment', text: '// auto-généré depuis votre MPD' },
      { type: 'blank' },
      { type: 'model', text: 'User' },
      { type: 'field', name: 'id', flagged: 'Int', suffix: '@id @default(autoincrement())' },
      { type: 'field', name: 'email', flagged: 'String', suffix: '@unique @db.VarChar(255)' },
      { type: 'field', name: 'name', flagged: 'String', suffix: '@db.VarChar(120)' },
      { type: 'field', name: 'orders', flagged: 'Order[]', suffix: '' },
      { type: 'field', name: 'created_at', flagged: 'DateTime', suffix: '@default(now())' },
      { type: 'field', name: 'updated_at', flagged: 'DateTime', suffix: '@updatedAt' },
      { type: 'close' },
      { type: 'blank' },
      { type: 'model', text: 'Order' },
      { type: 'field', name: 'id', flagged: 'Int', suffix: '@id @default(autoincrement())' },
      { type: 'field', name: 'user_id', flagged: 'Int', suffix: '' },
      { type: 'field', name: 'user', flagged: 'User', suffix: '@relation(fields: [user_id], references: [id])' },
      { type: 'field', name: 'total', flagged: 'Decimal', suffix: '@db.Decimal(10, 2)' },
      { type: 'close' },
    ],
  },
  sql: {
    label: 'migration.sql',
    lines: [
      { type: 'comment', text: '-- auto-généré · MySQL 8' },
      { type: 'blank' },
      { type: 'sql-create', name: 'users' },
      { type: 'sql-col', name: 'id', ttype: 'BIGINT', suffix: 'AUTO_INCREMENT PRIMARY KEY' },
      { type: 'sql-col', name: 'email', ttype: 'VARCHAR(255)', suffix: 'NOT NULL UNIQUE' },
      { type: 'sql-col', name: 'name', ttype: 'VARCHAR(120)', suffix: 'NOT NULL' },
      { type: 'sql-col', name: 'created_at', ttype: 'TIMESTAMP', suffix: 'DEFAULT CURRENT_TIMESTAMP' },
      { type: 'sql-col', name: 'updated_at', ttype: 'TIMESTAMP', suffix: 'ON UPDATE CURRENT_TIMESTAMP' },
      { type: 'close-sql' },
      { type: 'blank' },
      { type: 'sql-create', name: 'orders' },
      { type: 'sql-col', name: 'id', ttype: 'BIGINT', suffix: 'AUTO_INCREMENT PRIMARY KEY' },
      { type: 'sql-col', name: 'user_id', ttype: 'BIGINT', suffix: 'NOT NULL' },
      { type: 'sql-col', name: 'total', ttype: 'DECIMAL(10,2)', suffix: 'NOT NULL' },
      { type: 'sql-fk', text: 'FOREIGN KEY (user_id) REFERENCES users(id)' },
      { type: 'close-sql' },
    ],
  },
  typescript: {
    label: 'User.ts',
    lines: [
      { type: 'comment', text: '// modèle TypeORM généré' },
      { type: 'blank' },
      { type: 'ts-import', text: 'import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from \'typeorm\'' },
      { type: 'ts-import', text: 'import { Order } from \'./Order\'' },
      { type: 'blank' },
      { type: 'ts-decorator', text: '@Entity(\'users\')' },
      { type: 'ts-class', text: 'export class User {' },
      { type: 'ts-deco-inline', text: '  @PrimaryGeneratedColumn()' },
      { type: 'ts-prop', name: 'id', ttype: 'number' },
      { type: 'blank' },
      { type: 'ts-deco-inline', text: '  @Column({ unique: true, length: 255 })' },
      { type: 'ts-prop', name: 'email', ttype: 'string' },
      { type: 'blank' },
      { type: 'ts-deco-inline', text: '  @OneToMany(() => Order, o => o.user)' },
      { type: 'ts-prop', name: 'orders', ttype: 'Order[]' },
      { type: 'close' },
    ],
  },
}

const currentCode = computed(() => codeSamples[activeCodeTab.value])

const workspaceUrl = computed(() => {
  const orgId = (data.value as any)?.session?.activeOrganizationId
  return orgId ? `/app/workspace/${orgId}` : '/app'
})
</script>

<template>
  <div class="flex min-h-[100dvh] flex-col bg-background text-foreground">
    <!-- ============================== NAV ============================== -->
    <header class="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <span
            class="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-mono text-[11px] font-bold text-primary-foreground shadow-sm"
            aria-hidden="true"
          >
            <span class="flex flex-col leading-none">
              <span class="flex">
                <span class="inline-block h-1 w-1 rounded-sm bg-primary-foreground" />
                <span class="ml-0.5 inline-block h-1 w-1 rounded-sm bg-primary-foreground/60" />
                <span class="ml-0.5 inline-block h-1 w-1 rounded-sm bg-primary-foreground/60" />
              </span>
              <span class="mt-0.5 flex">
                <span class="inline-block h-1 w-1 rounded-sm bg-primary-foreground/60" />
                <span class="ml-0.5 inline-block h-1 w-1 rounded-sm bg-primary-foreground" />
                <span class="ml-0.5 inline-block h-1 w-1 rounded-sm bg-primary-foreground/60" />
              </span>
              <span class="mt-0.5 flex">
                <span class="inline-block h-1 w-1 rounded-sm bg-primary-foreground/60" />
                <span class="ml-0.5 inline-block h-1 w-1 rounded-sm bg-primary-foreground/60" />
                <span class="ml-0.5 inline-block h-1 w-1 rounded-sm bg-primary-foreground" />
              </span>
            </span>
          </span>
          <span class="font-semibold tracking-tight">ModelizeMe</span>
          <Badge variant="secondary" class="ml-1 font-mono text-[10px]">v0.9 beta</Badge>
        </NuxtLink>

        <nav class="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" class="transition-colors hover:text-foreground">Fonctionnalités</a>
          <a href="#how" class="transition-colors hover:text-foreground">Comment ça marche</a>
          <a href="#generate" class="transition-colors hover:text-foreground">Génération</a>
          <a href="#pricing" class="transition-colors hover:text-foreground">Tarifs</a>
          <a href="#opensource" class="transition-colors hover:text-foreground">Open source</a>
        </nav>

        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            class="h-9 w-9"
            aria-label="Basculer le thème"
            @click="toggleTheme"
          >
            <Sun v-if="colorMode.value === 'dark'" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
          </Button>
          <template v-if="!data">
            <NuxtLink to="/sign-in" class="hidden sm:block">
              <Button variant="ghost" size="sm">Se connecter</Button>
            </NuxtLink>
            <NuxtLink to="/sign-up">
              <Button size="sm">
                Commencer
                <ArrowRight class="ml-1 h-3.5 w-3.5" />
              </Button>
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink :to="workspaceUrl">
              <Button size="sm">
                Ouvrir l'app
                <ArrowRight class="ml-1 h-3.5 w-3.5" />
              </Button>
            </NuxtLink>
            <Button variant="ghost" size="sm" @click="() => signOut({ callbackUrl: '/' })">
              Déconnexion
            </Button>
          </template>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <!-- ============================== HERO ============================== -->
      <section class="relative overflow-hidden">
        <!-- Grid background -->
        <div
          class="pointer-events-none absolute inset-0 opacity-60 dark:opacity-40"
          style="background-image: linear-gradient(to right, hsl(var(--border) / 0.4) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.4) 1px, transparent 1px); background-size: 56px 56px;"
        />
        <!-- Gradient glow -->
        <div class="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-3xl" />

        <div class="relative mx-auto max-w-7xl px-4 pb-20 pt-20 md:pb-32 md:pt-28 lg:px-6">
          <div class="grid items-center gap-12 lg:grid-cols-12">
          <div class="lg:col-span-7">
            <div class="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs backdrop-blur">
              <span class="relative flex h-1.5 w-1.5">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span class="font-mono text-muted-foreground">v0.9 · Pipeline Merise + collab live</span>
              <Separator orientation="vertical" class="h-3" />
              <span class="text-muted-foreground">MIT</span>
            </div>

            <h1 class="mt-6 text-5xl font-semibold leading-[1.05] tracking-tighter sm:text-6xl md:text-7xl">
              Modélisez vos données.<br />
              <span class="text-muted-foreground">Générez </span>
              <span class="italic text-primary" style="font-family: 'Merriweather', serif;">votre stack.</span>
            </h1>

            <p class="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              ModelizeMe est un IDE open source basé sur la méthode Merise. Dessinez vos entités, dérivez
              <span class="font-medium text-blue-500 dark:text-blue-400">MCD</span> →
              <span class="font-medium text-emerald-500 dark:text-emerald-400">MLD</span> →
              <span class="font-medium text-purple-500 dark:text-purple-400">MPD</span>
              en un clic, puis générez migrations et modèles ORM pour la stack de votre choix.
            </p>

            <div class="mt-8 flex flex-wrap items-center gap-3">
              <NuxtLink :to="data ? workspaceUrl : '/sign-up'">
                <Button size="lg" class="gap-2">
                  Commencer gratuitement
                  <ArrowRight class="h-4 w-4" />
                </Button>
              </NuxtLink>
              <Button variant="outline" size="lg" class="gap-2" as="a" href="https://github.com">
                <Github class="h-4 w-4" />
                Voir sur GitHub
              </Button>
              <Button variant="ghost" size="lg" class="gap-2 text-muted-foreground">
                <Play class="h-4 w-4" />
                Démo 90s
              </Button>
            </div>

            <div class="mt-8 flex flex-wrap items-center gap-5 font-mono text-xs text-muted-foreground">
              <span class="inline-flex items-center gap-2">
                <span class="h-1 w-1 rounded-full bg-muted-foreground" />Self-host en 30s
              </span>
              <span class="inline-flex items-center gap-2">
                <span class="h-1 w-1 rounded-full bg-muted-foreground" />Sans carte bleue
              </span>
              <span class="inline-flex items-center gap-2">
                <span class="h-1 w-1 rounded-full bg-muted-foreground" />Fonctionne hors-ligne
              </span>
            </div>
          </div>

          <!-- Hero right visual -->
          <div class="relative hidden lg:col-span-5 lg:block">
            <div class="pointer-events-none absolute -inset-6 bg-gradient-to-br from-blue-500/20 via-primary/20 to-purple-500/20 opacity-60 blur-3xl" />
            <Card class="relative space-y-4 border-border/60 bg-card/60 p-5 backdrop-blur">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <Workflow class="h-3.5 w-3.5" />
                  exemple de pipeline
                </div>
                <Badge variant="outline" class="font-mono text-[10px]">MCD</Badge>
              </div>

              <!-- Mini diagram -->
              <div class="relative h-48 overflow-hidden rounded-lg border border-border/60 bg-background/60 p-3">
                <div class="absolute left-3 top-3 rounded-md border border-blue-500/30 bg-blue-500/5 px-2.5 py-1.5 font-mono text-[10px]">
                  <div class="flex items-center gap-1.5 font-semibold">
                    <span class="h-1.5 w-1.5 rounded-full bg-blue-500" />USER
                  </div>
                  <div class="mt-1 space-y-0.5 text-muted-foreground">
                    <div>🔑 id</div>
                    <div>email</div>
                  </div>
                </div>

                <div class="absolute right-3 top-8 rounded-md border border-blue-500/30 bg-blue-500/5 px-2.5 py-1.5 font-mono text-[10px]">
                  <div class="flex items-center gap-1.5 font-semibold">
                    <span class="h-1.5 w-1.5 rounded-full bg-blue-500" />ORDER
                  </div>
                  <div class="mt-1 space-y-0.5 text-muted-foreground">
                    <div>🔑 id</div>
                    <div>total</div>
                  </div>
                </div>

                <div class="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md border border-blue-500/30 bg-blue-500/5 px-2.5 py-1.5 font-mono text-[10px]">
                  <div class="flex items-center gap-1.5 font-semibold">
                    <span class="h-1.5 w-1.5 rounded-full bg-blue-500" />PRODUCT
                  </div>
                  <div class="mt-1 text-muted-foreground">🔑 id · sku</div>
                </div>

                <svg class="absolute inset-0 h-full w-full" viewBox="0 0 400 192" fill="none">
                  <path d="M90 38 Q 180 40 270 50" stroke="hsl(217 91% 60%)" stroke-width="1.5" fill="none" />
                  <path d="M90 60 Q 160 130 180 150" stroke="hsl(217 91% 60%)" stroke-width="1.5" fill="none" />
                  <path d="M285 80 Q 280 130 240 150" stroke="hsl(217 91% 60%)" stroke-width="1.5" fill="none" />
                </svg>
              </div>

              <div class="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                <span>3 entités · 3 relations</span>
                <span class="inline-flex items-center gap-1.5">
                  <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  auto-layout
                </span>
              </div>
            </Card>
          </div>
          </div>

          <!-- Browser mock -->
          <div class="relative mt-16">
            <div class="absolute -inset-x-10 -top-10 h-40 bg-gradient-to-r from-blue-500/20 via-primary/20 to-purple-500/20 opacity-60 blur-3xl" />

            <Card class="relative overflow-hidden border-border/60 shadow-2xl">
              <!-- Window chrome -->
              <div class="flex h-10 items-center gap-2 border-b border-border/60 bg-muted/40 px-4">
                <span class="h-3 w-3 rounded-full bg-red-400" />
                <span class="h-3 w-3 rounded-full bg-yellow-400" />
                <span class="h-3 w-3 rounded-full bg-green-400" />
                <div class="mx-auto flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-3 py-1 font-mono text-xs text-muted-foreground">
                  <Shield class="h-3 w-3" />
                  app.modelize.me/workspace/acme/model/users-billing
                </div>
                <div class="flex -space-x-2">
                  <Avatar class="h-6 w-6 border-2 border-muted text-[10px]">
                    <AvatarFallback class="flex h-full w-full items-center justify-center bg-blue-500 text-white">SM</AvatarFallback>
                  </Avatar>
                  <Avatar class="h-6 w-6 border-2 border-muted text-[10px]">
                    <AvatarFallback class="flex h-full w-full items-center justify-center bg-emerald-500 text-white">JD</AvatarFallback>
                  </Avatar>
                  <Avatar class="h-6 w-6 border-2 border-muted text-[10px]">
                    <AvatarFallback class="flex h-full w-full items-center justify-center bg-purple-500 text-white">+3</AvatarFallback>
                  </Avatar>
                </div>
              </div>

              <!-- App body -->
              <div class="grid min-h-[500px] grid-cols-12">
                <aside class="col-span-3 hidden space-y-4 border-r border-border/60 bg-muted/20 p-3 md:block lg:col-span-2">
                  <div>
                    <p class="mb-1 px-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Workspace
                    </p>
                    <div class="flex items-center gap-2 rounded-md bg-accent/50 px-2 py-1.5 text-sm">
                      <span class="h-4 w-4 rounded bg-gradient-to-br from-blue-400 to-purple-400" />
                      Acme Labs
                    </div>
                  </div>
                  <div>
                    <p class="mb-1 px-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Modèles
                    </p>
                    <div class="space-y-0.5 text-sm">
                      <div class="flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-2 py-1">
                        <span class="h-1 w-1 rounded-full bg-emerald-500" />
                        users-billing
                      </div>
                      <div class="flex items-center gap-2 px-2 py-1 text-muted-foreground">
                        <span class="h-1 w-1 rounded-full bg-muted-foreground/50" />inventory
                      </div>
                      <div class="flex items-center gap-2 px-2 py-1 text-muted-foreground">
                        <span class="h-1 w-1 rounded-full bg-muted-foreground/50" />orders-v2
                      </div>
                      <div class="flex items-center gap-2 px-2 py-1 text-muted-foreground">
                        <span class="h-1 w-1 rounded-full bg-muted-foreground/50" />cms-core
                      </div>
                    </div>
                  </div>
                  <div>
                    <p class="mb-1 px-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Équipes
                    </p>
                    <div class="space-y-0.5 text-sm text-muted-foreground">
                      <div class="flex items-center gap-2 px-2 py-1">
                        <span class="h-1.5 w-1.5 rounded-sm bg-blue-500" />Backend
                      </div>
                      <div class="flex items-center gap-2 px-2 py-1">
                        <span class="h-1.5 w-1.5 rounded-sm bg-emerald-500" />Data
                      </div>
                      <div class="flex items-center gap-2 px-2 py-1">
                        <span class="h-1.5 w-1.5 rounded-sm bg-purple-500" />Platform
                      </div>
                    </div>
                  </div>
                </aside>

                <div
                  class="relative col-span-12 md:col-span-9 lg:col-span-10"
                  style="background-image: radial-gradient(hsl(var(--border)) 1px, transparent 1px); background-size: 18px 18px;"
                >
                  <!-- Tabs -->
                  <div class="absolute left-3 top-3 z-10">
                    <Tabs v-model="activeTab">
                      <TabsList class="h-8">
                        <TabsTrigger value="mcd" class="gap-1.5 text-xs">
                          <span class="h-1.5 w-1.5 rounded-full bg-blue-500" />MCD
                        </TabsTrigger>
                        <TabsTrigger value="mld" class="gap-1.5 text-xs">
                          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />MLD
                        </TabsTrigger>
                        <TabsTrigger value="mpd" class="gap-1.5 text-xs">
                          <span class="h-1.5 w-1.5 rounded-full bg-purple-500" />MPD
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div class="absolute right-3 top-3 z-10 flex items-center gap-2">
                    <Button variant="outline" size="sm" class="h-8 gap-1.5 text-xs">
                      <Layers class="h-3 w-3" />Auto-layout
                    </Button>
                    <Button size="sm" class="h-8 text-xs">Générer le code</Button>
                  </div>

                  <!-- SVG diagram (stroke color follows active tab) -->
                  <svg viewBox="0 0 800 480" class="block h-auto w-full" preserveAspectRatio="xMidYMid meet">
                    <g
                      fill="none"
                      stroke-width="1.5"
                      :class="{
                        'stroke-blue-500': activeTab === 'mcd',
                        'stroke-emerald-500': activeTab === 'mld',
                        'stroke-purple-500': activeTab === 'mpd',
                      }"
                    >
                      <path d="M210,160 C290,160 310,230 400,230" />
                      <path d="M540,230 C600,230 620,170 690,170" />
                      <path d="M540,260 C600,260 620,320 690,320" />
                      <path d="M120,220 C120,320 180,360 250,360" />
                    </g>
                    <g fill="hsl(var(--muted-foreground))" font-size="11" font-family="monospace">
                      <text x="240" y="150">{{ activeTab === 'mpd' ? 'FK' : '1,1' }}</text>
                      <text x="360" y="220">{{ activeTab === 'mpd' ? 'FK' : '0,N' }}</text>
                      <text x="560" y="200">{{ activeTab === 'mpd' ? 'FK' : '0,N' }}</text>
                      <text x="560" y="290">{{ activeTab === 'mpd' ? 'FK' : '1,N' }}</text>
                      <text x="110" y="320">{{ activeTab === 'mpd' ? 'FK' : '1,N' }}</text>
                    </g>
                  </svg>

                  <!-- Entity cards (side entities) -->
                  <div
                    v-for="(ent, i) in currentTab.entities"
                    :key="`${activeTab}-${i}`"
                    class="absolute"
                    :style="[
                      i === 0 ? { left: '6%', top: '14%', width: '18%', minWidth: '140px' } :
                      i === 1 ? { right: '4%', top: '22%', width: '18%', minWidth: '140px' } :
                      { left: '28%', top: '66%', width: '17%', minWidth: '140px' },
                    ]"
                  >
                    <div class="rounded-lg border border-border/60 bg-card/90 backdrop-blur">
                      <div class="flex items-center gap-1.5 border-b border-border/60 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider">
                        <span
                          class="h-1.5 w-1.5 rounded-full"
                          :class="currentTab.dotColor"
                        />
                        {{ ent.name }}
                      </div>
                      <div
                        v-for="row in ent.rows"
                        :key="row[0]"
                        class="flex justify-between border-t border-border/40 px-2.5 py-1 font-mono text-[10.5px]"
                      >
                        <span :class="row[0].includes('🔑') ? 'font-semibold' : 'text-muted-foreground'">{{ row[0] }}</span>
                        <span class="text-muted-foreground">{{ row[1] }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Center highlighted entity -->
                  <div class="absolute" style="left:42%; top:40%; width:16%; min-width:130px;">
                    <div class="rounded-lg border-2 border-primary/60 bg-card/90 shadow-lg shadow-primary/20 backdrop-blur">
                      <div class="flex items-center gap-1.5 border-b border-border/60 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider">
                        <span class="h-1.5 w-1.5 rounded-full bg-primary" />{{ currentTab.center.name }}
                      </div>
                      <div
                        v-for="row in currentTab.center.rows"
                        :key="row[0]"
                        class="flex justify-between border-t border-border/40 px-2.5 py-1 font-mono text-[10.5px]"
                      >
                        <span :class="row[0].includes('🔑') ? 'font-semibold' : 'text-muted-foreground'">{{ row[0] }}</span>
                        <span class="text-muted-foreground">{{ row[1] }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Bottom strip -->
                  <div class="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-border/60 bg-muted/40 px-4 py-2 font-mono text-xs text-muted-foreground">
                    <div class="flex items-center gap-4">
                      <span class="inline-flex items-center gap-1.5">
                        <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        synchronisé via Yjs
                      </span>
                      <span>4 entités · 5 relations</span>
                    </div>
                    <div class="hidden items-center gap-3 sm:flex">
                      <kbd class="rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px]">⌘K</kbd>
                      <kbd class="rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px]">⌘Z</kbd>
                      <kbd class="rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px]">⌘⇧G</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <!-- Built on -->
          <div class="mt-16 text-center">
            <p class="font-mono text-xs uppercase tracking-widest text-muted-foreground">Construit sur des standards ouverts</p>
            <div class="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-muted-foreground">
              <span class="inline-flex items-center gap-2 text-[15px] font-medium">
                <span class="h-4 w-4 rounded-sm" style="background:#00DC82" />Nuxt
              </span>
              <span class="inline-flex items-center gap-2 text-[15px] font-medium">
                <span class="h-4 w-4 rotate-45" style="background:#42b883" />Vue 3
              </span>
              <span class="inline-flex items-center gap-2 text-[15px] font-medium">
                <Database class="h-4 w-4" />Prisma
              </span>
              <span class="inline-flex items-center gap-2 text-[15px] font-medium">
                <span class="h-4 w-4 rounded-full bg-emerald-500" />Yjs
              </span>
              <span class="inline-flex items-center gap-2 text-[15px] font-medium">
                <span class="h-4 w-4 rounded bg-slate-400" />Tailwind
              </span>
              <span class="inline-flex items-center gap-2 text-[15px] font-medium">
                <span class="h-4 w-4 rounded bg-foreground" />shadcn
              </span>
            </div>
          </div>
        </div>
      </section>


      <!-- ============================== FEATURES ============================== -->
      <section id="features" class="py-24 md:py-32">
        <div class="mx-auto max-w-7xl px-4 lg:px-6">
          <div class="mb-14 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p class="font-mono text-xs uppercase tracking-widest text-primary">01 · fonctionnalités</p>
              <h2 class="mt-3 max-w-xl text-4xl font-semibold tracking-tight md:text-5xl">
                Tout ce qu'il vous faut,<br />
                <span class="text-muted-foreground">rien que vous n'utilisez pas.</span>
              </h2>
            </div>
            <p class="max-w-md leading-relaxed text-muted-foreground">
              Des outils pensés pour accompagner votre modélisation, de la première entité à la mise en production.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card
              v-for="feature in features"
              :key="feature.title"
              class="group relative overflow-hidden border-border/60 p-7 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:from-primary/[0.03] group-hover:to-primary/[0.08] group-hover:opacity-100" />
              <div class="relative">
                <div class="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-muted/40 transition-colors group-hover:border-primary/30 group-hover:bg-primary/10">
                  <component :is="feature.icon" class="h-5 w-5 text-primary" />
                </div>
                <h3 class="mb-2 text-lg font-semibold tracking-tight">{{ feature.title }}</h3>
                <p class="text-sm leading-relaxed text-muted-foreground">{{ feature.description }}</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <!-- ============================== HOW IT WORKS ============================== -->
      <section id="how" class="border-t border-border py-24 md:py-32">
        <div class="mx-auto max-w-7xl px-4 lg:px-6">
          <div class="mb-16">
            <p class="font-mono text-xs uppercase tracking-widest text-primary">02 · comment ça marche</p>
            <h2 class="mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
              Du canvas vide au
              <span class="italic text-emerald-500 dark:text-emerald-400" style="font-family: 'Merriweather', serif;">code expédié</span>,
              en trois étapes honnêtes.
            </h2>
          </div>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            <Card
              v-for="step in steps"
              :key="step.num"
              class="relative overflow-hidden border-border/60"
            >
              <CardContent class="p-6">
                <div class="mb-6 flex items-center gap-2">
                  <span :class="['flex h-7 w-7 items-center justify-center rounded-md font-mono text-xs font-semibold', step.bg, step.accent]">
                    {{ step.num }}
                  </span>
                  <span class="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Étape {{ step.num }}</span>
                </div>
                <h3 class="mb-2 text-2xl font-semibold tracking-tight">{{ step.title }}</h3>
                <p class="mb-6 text-sm leading-relaxed text-muted-foreground">{{ step.description }}</p>

                <!-- Step-specific visual -->
                <div :class="['flex h-36 items-center justify-center rounded-lg border border-border/60 p-3', step.bg]">
                  <!-- Step 01: 2 entities being connected -->
                  <div v-if="step.num === '01'" class="flex w-full items-center justify-around">
                    <div class="rounded border border-border/60 bg-card/80 px-2 py-1.5 text-[10px] font-mono">
                      <div class="font-semibold">USER</div>
                      <div class="text-muted-foreground">id · email</div>
                    </div>
                    <svg width="40" height="16" viewBox="0 0 40 16" fill="none" class="shrink-0">
                      <path d="M2 8 H38" :stroke="'currentColor'" stroke-width="1.5" stroke-dasharray="4 3" :class="step.accent" />
                      <text x="12" y="6" font-size="7" fill="currentColor" class="text-muted-foreground">1,N</text>
                    </svg>
                    <div class="rounded border border-border/60 bg-card/80 px-2 py-1.5 text-[10px] font-mono">
                      <div class="font-semibold">ORDER</div>
                      <div class="text-muted-foreground">id · total</div>
                    </div>
                  </div>

                  <!-- Step 02: MCD → MLD → MPD -->
                  <div v-else-if="step.num === '02'" class="flex w-full items-center justify-around gap-1 font-mono text-[10px]">
                    <div class="rounded border border-blue-500/40 bg-blue-500/10 px-2 py-1.5 font-semibold text-blue-500 dark:text-blue-400">MCD</div>
                    <ArrowRight class="h-3 w-3 text-muted-foreground" />
                    <div class="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 font-semibold text-emerald-500 dark:text-emerald-400">MLD</div>
                    <ArrowRight class="h-3 w-3 text-muted-foreground" />
                    <div class="rounded border border-purple-500/40 bg-purple-500/10 px-2 py-1.5 font-semibold text-purple-500 dark:text-purple-400">MPD</div>
                  </div>

                  <!-- Step 03: terminal-like output -->
                  <div v-else class="w-full space-y-0.5 font-mono text-[10px] leading-relaxed">
                    <div class="text-muted-foreground">$ modelize generate</div>
                    <div><span class="text-emerald-500">✓</span> <span class="text-muted-foreground">schema.prisma</span></div>
                    <div><span class="text-emerald-500">✓</span> <span class="text-muted-foreground">migrations/0001_init.sql</span></div>
                    <div><span class="text-emerald-500">✓</span> <span class="text-muted-foreground">models/User.ts · Order.ts</span></div>
                    <div class="text-muted-foreground/70">prêt en 2.1s</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <!-- ============================== CODE GEN ============================== -->
      <section id="generate" class="border-t border-border bg-muted/20 py-24 md:py-32">
        <div class="mx-auto max-w-7xl px-4 lg:px-6">
          <div class="grid items-start gap-12 lg:grid-cols-12">
            <div class="lg:col-span-5">
              <p class="font-mono text-xs uppercase tracking-widest text-primary">03 · génération de code</p>
              <h2 class="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
                Un modèle,<br />
                <span class="italic text-purple-500 dark:text-purple-400" style="font-family: 'Merriweather', serif;">n'importe quelle stack.</span>
              </h2>
              <p class="mt-5 leading-relaxed text-muted-foreground">
                Arrêtez de retaper vos schémas à la main. Choisissez le framework que votre équipe utilise vraiment, un ORM, une base. ModelizeMe génère le code que vous auriez écrit vous-même.
              </p>

              <div class="mt-8 space-y-5">
                <div>
                  <p class="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Frameworks</p>
                  <div class="flex flex-wrap gap-2">
                    <Badge
                      v-for="f in frameworks"
                      :key="f.name"
                      variant="outline"
                      :class="f.soon && 'opacity-50'"
                    >
                      {{ f.name }}
                      <span v-if="f.soon" class="ml-1.5 text-[10px] text-muted-foreground">· bientôt</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <p class="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">ORMs</p>
                  <div class="flex flex-wrap gap-2">
                    <Badge v-for="o in orms" :key="o" variant="outline">{{ o }}</Badge>
                  </div>
                </div>
                <div>
                  <p class="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Bases de données</p>
                  <div class="flex flex-wrap gap-2">
                    <Badge v-for="db in databases" :key="db" variant="outline" class="gap-1.5">
                      <Database class="h-3 w-3" />{{ db }}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div class="lg:col-span-7">
              <Card class="overflow-hidden border-border/60 shadow-xl">
                <div class="flex items-center border-b border-border/60 bg-muted/40">
                  <button
                    v-for="(sample, key) in codeSamples"
                    :key="key"
                    class="border-r border-border/60 px-4 py-2.5 font-mono text-xs transition-colors"
                    :class="activeCodeTab === key
                      ? 'bg-background text-foreground'
                      : 'text-muted-foreground hover:text-foreground'"
                    @click="activeCodeTab = key as 'prisma' | 'sql' | 'typescript'"
                  >
                    {{ sample.label }}
                  </button>
                  <div class="ml-auto flex items-center gap-2 px-3 font-mono text-[11px] text-muted-foreground">
                    <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />généré
                  </div>
                </div>

                <div class="min-h-[360px] overflow-x-auto bg-background p-5 font-mono text-[12.5px] leading-relaxed">
                  <template v-for="(line, i) in currentCode.lines" :key="`${activeCodeTab}-${i}`">
                    <div v-if="line.type === 'blank'" class="h-4" />
                    <div v-else-if="line.type === 'comment'" class="text-muted-foreground">{{ line.text }}</div>

                    <!-- Prisma -->
                    <div v-else-if="line.type === 'model'">
                      <span class="text-purple-500 dark:text-purple-400">model </span>
                      <span class="font-semibold"> {{ line.text }} </span>
                      <span>{</span>
                    </div>
                    <div v-else-if="line.type === 'field'" class="pl-4">
                      <span class="text-blue-500 dark:text-blue-400">{{ line.name }}</span>
                      <span class="text-emerald-500 dark:text-emerald-400"> {{ line.flagged }}</span>
                      <span v-if="line.suffix" class="text-muted-foreground"> {{ line.suffix }}</span>
                    </div>
                    <div v-else-if="line.type === 'close'">}</div>

                    <!-- SQL -->
                    <div v-else-if="line.type === 'sql-create'">
                      <span class="text-purple-500 dark:text-purple-400">CREATE TABLE </span>
                      <span class="font-semibold"> {{ line.name }} </span>
                      <span>(</span>
                    </div>
                    <div v-else-if="line.type === 'sql-col'" class="pl-4">
                      <span class="text-blue-500 dark:text-blue-400">{{ line.name }}</span>
                      <span class="text-emerald-500 dark:text-emerald-400"> {{ line.ttype }}</span>
                      <span v-if="line.suffix" class="text-muted-foreground"> {{ line.suffix }}</span>
                    </div>
                    <div v-else-if="line.type === 'sql-fk'" class="pl-4 text-muted-foreground">{{ line.text }}</div>
                    <div v-else-if="line.type === 'close-sql'">);</div>

                    <!-- TypeScript -->
                    <div v-else-if="line.type === 'ts-import'" class="text-muted-foreground">{{ line.text }}</div>
                    <div v-else-if="line.type === 'ts-decorator'" class="text-purple-500 dark:text-purple-400">{{ line.text }}</div>
                    <div v-else-if="line.type === 'ts-class'">
                      <span class="text-purple-500 dark:text-purple-400">export class</span>
                      <span class="font-semibold"> User </span>
                      <span>{</span>
                    </div>
                    <div v-else-if="line.type === 'ts-deco-inline'" class="text-purple-500 dark:text-purple-400">{{ line.text }}</div>
                    <div v-else-if="line.type === 'ts-prop'" class="pl-4">
                      <span class="text-blue-500 dark:text-blue-400">{{ line.name }}</span>
                      <span>: </span>
                      <span class="text-emerald-500 dark:text-emerald-400">{{ line.ttype }}</span>
                      <span>;</span>
                    </div>
                  </template>
                </div>

                <div class="flex items-center justify-between border-t border-border/60 bg-muted/40 px-4 py-3">
                  <div class="flex items-center gap-3 font-mono text-xs text-muted-foreground">
                    <kbd class="rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px] text-emerald-500">⌘⇧G</kbd>
                    <span>régénéré à chaque changement du modèle</span>
                  </div>
                </div>
              </Card>
              <p class="mt-3 text-center font-mono text-[11px] text-muted-foreground">
                Exemple illustratif. Le code réel s'adapte à votre modèle complet.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================== COLLABORATION ============================== -->
      <section class="border-t border-border py-24 md:py-32">
        <div class="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-12 lg:px-6">
          <div class="order-2 lg:order-1 lg:col-span-7">
            <Card class="relative h-[420px] overflow-hidden border-border/60 p-8 shadow-xl">
              <div
                class="absolute inset-0 opacity-40"
                style="background-image: radial-gradient(hsl(var(--border)) 1px, transparent 1px); background-size: 22px 22px;"
              />

              <div class="absolute left-1/2 top-1/2 w-64 -translate-x-1/2 -translate-y-1/2">
                <div class="rounded-lg border border-border/60 bg-card shadow-xl">
                  <div class="flex items-center gap-1.5 border-b border-border/60 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider">
                    <span class="h-1.5 w-1.5 rounded-full bg-primary" />CUSTOMER
                  </div>
                  <div class="flex justify-between border-t border-border/40 px-2.5 py-1 font-mono text-[10.5px]">
                    <span class="font-semibold">🔑 id</span><span class="text-muted-foreground">int</span>
                  </div>
                  <div class="flex justify-between border-t border-border/40 px-2.5 py-1 font-mono text-[10.5px]">
                    <span class="text-muted-foreground">email</span><span class="text-muted-foreground">varchar(255)</span>
                  </div>
                  <div class="flex justify-between border-t border-border/40 px-2.5 py-1 font-mono text-[10.5px]">
                    <span class="text-muted-foreground">plan</span><span class="text-muted-foreground">enum</span>
                  </div>
                  <div class="flex justify-between border-t border-border/40 bg-blue-500/10 px-2.5 py-1 font-mono text-[10.5px]">
                    <span class="text-blue-500 dark:text-blue-400">stripe_id</span><span class="text-muted-foreground">varchar</span>
                  </div>
                </div>
              </div>

              <!-- Remote cursor label -->
              <div class="absolute right-10 top-16 flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2 L14 8 L8 9 L10 14 L8 15 L6 10 L2 14 Z" fill="hsl(262 83% 68%)" stroke="white" stroke-width="1"/>
                </svg>
                <span class="rounded bg-purple-500 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white">Léo</span>
              </div>

              <!-- Presence -->
              <div class="absolute bottom-6 left-6 flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-xs backdrop-blur">
                <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span class="font-mono">3 en édition</span>
                <Separator orientation="vertical" class="h-3" />
                <div class="flex -space-x-1.5">
                  <Avatar class="h-5 w-5 border border-background text-[9px]">
                    <AvatarFallback class="flex h-full w-full items-center justify-center bg-blue-500 text-white">SM</AvatarFallback>
                  </Avatar>
                  <Avatar class="h-5 w-5 border border-background text-[9px]">
                    <AvatarFallback class="flex h-full w-full items-center justify-center bg-emerald-500 text-white">JD</AvatarFallback>
                  </Avatar>
                  <Avatar class="h-5 w-5 border border-background text-[9px]">
                    <AvatarFallback class="flex h-full w-full items-center justify-center bg-purple-500 text-white">LM</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </Card>
          </div>

          <div class="order-1 lg:order-2 lg:col-span-5">
            <p class="font-mono text-xs uppercase tracking-widest text-primary">04 · collaboration</p>
            <h2 class="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
              Tout le monde sur le
              <span class="italic text-blue-500 dark:text-blue-400" style="font-family: 'Merriweather', serif;">même diagramme.</span>
            </h2>
            <p class="mt-5 leading-relaxed text-muted-foreground">
              Yjs CRDT, sync WebSocket, awareness par workspace. Voyez les curseurs en temps réel, éditez simultanément sans conflit, tout reste cohérent même en cas de reconnexion.
            </p>
            <ul class="mt-8 space-y-3 text-sm">
              <li class="flex items-start gap-3">
                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <span><span class="font-medium">Curseurs live & présence.</span> <span class="text-muted-foreground">Qui regarde quoi, en temps réel.</span></span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span><span class="font-medium">Workspaces, équipes, rôles.</span> <span class="text-muted-foreground">Owner, admin, member avec des défauts sensés.</span></span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                <span><span class="font-medium">OAuth Google, GitHub, GitLab.</span> <span class="text-muted-foreground">Connectez-vous avec ce que vous avez déjà.</span></span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span><span class="font-medium">Event sourcing et undo/redo.</span> <span class="text-muted-foreground">Chaque action est traçable, Ctrl+Z fiable.</span></span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- ============================== OPEN SOURCE ============================== -->
      <section id="opensource" class="border-t border-border bg-muted/20 py-24 md:py-32">
        <div class="mx-auto max-w-7xl px-4 lg:px-6">
          <div class="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p class="font-mono text-xs uppercase tracking-widest text-primary">05 · open source</p>
              <h2 class="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
                Licence MIT.<br />
                <span class="text-muted-foreground">À vous pour toujours.</span>
              </h2>
              <p class="mt-5 max-w-lg leading-relaxed text-muted-foreground">
                Forkez-le, auditez-le, déployez-le derrière votre VPN. Aucune télémétrie non consentie, pas de "enterprise tier" qui cache les meilleures features. Juste un Dockerfile et un README.
              </p>
              <div class="mt-8 flex flex-wrap items-center gap-3">
                <Button variant="outline" size="lg" class="gap-2">
                  <Github class="h-4 w-4" />
                  Star sur GitHub
                </Button>
                <Badge variant="outline" class="gap-1.5 border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-600 dark:text-emerald-400">
                  <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Licence MIT
                </Badge>
                <Badge variant="outline" class="px-3 py-2">Docker Compose</Badge>
              </div>
            </div>

            <div>
              <Card class="overflow-hidden border-border/60 shadow-xl">
                <div class="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
                  <div class="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    self-host en 30s
                  </div>
                  <Button variant="ghost" size="xs" class="font-mono text-[11px]">copier</Button>
                </div>
                <pre class="overflow-x-auto bg-background p-5 font-mono text-[13px] leading-relaxed"><code><span class="text-muted-foreground"># clone le repo</span>
<span class="text-emerald-500">$</span> git clone https://github.com/modelizeme/modelizeme.git
<span class="text-emerald-500">$</span> cd modelizeme

<span class="text-muted-foreground"># lance la stack</span>
<span class="text-emerald-500">$</span> docker compose --profile dev up -d --build

<span class="text-muted-foreground"># ouvre</span>
<span class="text-purple-500 dark:text-purple-400">→</span> http://localhost:3000</code></pre>
              </Card>
              <div class="mt-4 grid grid-cols-3 gap-3 text-center">
                <Card class="border-border/60 p-3">
                  <div class="text-xl font-semibold">3</div>
                  <div class="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">containers</div>
                </Card>
                <Card class="border-border/60 p-3">
                  <div class="text-xl font-semibold">0</div>
                  <div class="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">vendor lock-in</div>
                </Card>
                <Card class="border-border/60 p-3">
                  <div class="text-xl font-semibold">~30s</div>
                  <div class="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">pour démarrer</div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================== PRICING ============================== -->
      <section id="pricing" class="border-t border-border py-24 md:py-32">
        <div class="mx-auto max-w-7xl px-4 lg:px-6">
          <div class="mx-auto mb-16 max-w-2xl text-center">
            <p class="font-mono text-xs uppercase tracking-widest text-primary">06 · tarifs</p>
            <h2 class="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
              Gratuit pour commencer.<br />
              <span class="italic text-purple-500 dark:text-purple-400" style="font-family: 'Merriweather', serif;">Évolue avec vous.</span>
            </h2>
            <p class="mt-4 leading-relaxed text-muted-foreground">
              Self-hostez tout gratuitement, pour toujours. Notre cloud vous épargne juste le docker compose.
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card
              v-for="plan in plans"
              :key="plan.name"
              :class="[
                'relative flex flex-col p-6',
                plan.featured
                  ? 'border-primary/40 bg-gradient-to-b from-primary/5 to-transparent shadow-xl shadow-primary/10'
                  : 'border-border/60',
              ]"
            >
              <div v-if="plan.featured" class="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge class="bg-primary font-mono text-[11px] uppercase tracking-wider text-primary-foreground">
                  Recommandé
                </Badge>
              </div>

              <h3 class="text-lg font-semibold">{{ plan.name }}</h3>
              <div class="mt-4 flex items-baseline gap-1">
                <span class="text-4xl font-semibold tracking-tight">{{ plan.price }}</span>
                <span class="text-xs text-muted-foreground">{{ plan.period }}</span>
              </div>
              <p class="mt-2 min-h-[2.5rem] text-sm text-muted-foreground">{{ plan.tagline }}</p>

              <Button
                v-if="plan.name === 'Self-host'"
                :variant="'outline'"
                class="mt-5 w-full"
                size="sm"
                as="a"
                href="#opensource"
              >
                {{ plan.cta }}
              </Button>
              <NuxtLink v-else :to="data ? workspaceUrl : '/sign-up'" class="mt-5 w-full">
                <Button
                  :variant="plan.featured ? 'default' : 'outline'"
                  class="w-full"
                  size="sm"
                >
                  {{ plan.cta }}
                </Button>
              </NuxtLink>

              <ul class="mt-6 flex-1 space-y-2.5 text-sm">
                <li
                  v-for="feat in plan.features"
                  :key="feat.label"
                  :class="['flex gap-2', !feat.included && 'text-muted-foreground']"
                >
                  <Check
                    v-if="feat.included"
                    class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                  />
                  <X v-else class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                  <span>{{ feat.label }}</span>
                </li>
              </ul>
            </Card>
          </div>

          <p class="mt-10 text-center text-sm text-muted-foreground">
            Pas sûr du plan ? Commencez par Cloud Free, aucune carte bancaire requise.
          </p>
        </div>
      </section>

      <!-- ============================== CTA ============================== -->
      <section id="cta" class="relative overflow-hidden border-t border-border py-24 md:py-32">
        <div class="pointer-events-none absolute inset-0">
          <div class="absolute left-1/2 top-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500/20 via-primary/30 to-purple-500/20 opacity-40 blur-3xl" />
        </div>
        <div class="relative mx-auto max-w-4xl px-4 text-center lg:px-6">
          <h2 class="text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
            Votre prochain schéma,<br />
            <span class="italic" style="font-family: 'Merriweather', serif;">livré avant midi.</span>
          </h2>
          <p class="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Arrêtez de retaper vos schémas entre le whiteboard, la migration et l'ORM. Modélisez une fois, générez pour toujours.
          </p>
          <div class="mx-auto mt-10 flex max-w-lg flex-col items-stretch justify-center gap-3 sm:flex-row">
            <NuxtLink :to="data ? workspaceUrl : '/sign-up'" class="sm:flex-1">
              <Button size="lg" class="w-full gap-2">
                Créer un compte gratuit
                <ArrowRight class="h-4 w-4" />
              </Button>
            </NuxtLink>
            <Button variant="outline" size="lg" class="gap-2" as="a" href="#opensource">
              <Github class="h-4 w-4" />
              Self-host
            </Button>
          </div>
          <p class="mt-4 font-mono text-xs text-muted-foreground">
            Sans carte bancaire · gratuit en self-host · cloud hébergé en UE
          </p>
        </div>
      </section>
    </main>

    <!-- ============================== FOOTER ============================== -->
    <footer class="border-t border-border bg-background">
      <div class="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-12 lg:px-6">
        <div class="md:col-span-5">
          <div class="flex items-center gap-2.5">
            <span
              class="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-mono text-[11px] font-bold text-primary-foreground shadow-sm"
              aria-hidden="true"
            >
              <span class="flex flex-col leading-none">
                <span class="flex">
                  <span class="inline-block h-1 w-1 rounded-sm bg-primary-foreground" />
                  <span class="ml-0.5 inline-block h-1 w-1 rounded-sm bg-primary-foreground/60" />
                  <span class="ml-0.5 inline-block h-1 w-1 rounded-sm bg-primary-foreground/60" />
                </span>
                <span class="mt-0.5 flex">
                  <span class="inline-block h-1 w-1 rounded-sm bg-primary-foreground/60" />
                  <span class="ml-0.5 inline-block h-1 w-1 rounded-sm bg-primary-foreground" />
                  <span class="ml-0.5 inline-block h-1 w-1 rounded-sm bg-primary-foreground/60" />
                </span>
                <span class="mt-0.5 flex">
                  <span class="inline-block h-1 w-1 rounded-sm bg-primary-foreground/60" />
                  <span class="ml-0.5 inline-block h-1 w-1 rounded-sm bg-primary-foreground/60" />
                  <span class="ml-0.5 inline-block h-1 w-1 rounded-sm bg-primary-foreground" />
                </span>
              </span>
            </span>
            <span class="font-semibold">ModelizeMe</span>
          </div>
          <p class="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            L'IDE Merise open source. Modélisez vos données, collaborez en temps réel, générez votre stack.
          </p>
          <div class="mt-5 flex items-center gap-2">
            <Button variant="outline" size="icon" class="h-8 w-8" aria-label="GitHub">
              <Github class="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" class="h-8 w-8" aria-label="Discord">
              <MessageSquare class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div class="md:col-span-2">
          <p class="mb-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">Produit</p>
          <ul class="space-y-2.5 text-sm text-muted-foreground">
            <li><a href="#features" class="hover:text-foreground">Fonctionnalités</a></li>
            <li><a href="#generate" class="hover:text-foreground">Génération de code</a></li>
            <li><a href="#pricing" class="hover:text-foreground">Tarifs</a></li>
            <li><a href="#" class="hover:text-foreground">Changelog</a></li>
            <li><a href="#" class="hover:text-foreground">Roadmap</a></li>
          </ul>
        </div>

        <div class="md:col-span-2">
          <p class="mb-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">Développeurs</p>
          <ul class="space-y-2.5 text-sm text-muted-foreground">
            <li><a href="#" class="hover:text-foreground">Documentation</a></li>
            <li><a href="#" class="hover:text-foreground">GitHub</a></li>
            <li><a href="#" class="hover:text-foreground">Guide self-host</a></li>
            <li><a href="#" class="hover:text-foreground">CLI (bientôt)</a></li>
            <li><a href="#" class="hover:text-foreground">Référence API</a></li>
          </ul>
        </div>

        <div class="md:col-span-3">
          <p class="mb-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">Communauté</p>
          <ul class="space-y-2.5 text-sm text-muted-foreground">
            <li><a href="#" class="hover:text-foreground">Discord</a></li>
            <li><a href="#" class="hover:text-foreground">Twitter / X</a></li>
            <li><a href="#" class="hover:text-foreground">Galerie</a></li>
            <li><a href="#" class="hover:text-foreground">Contributeurs</a></li>
            <li><a href="#" class="hover:text-foreground">Signaler un bug</a></li>
          </ul>
        </div>
      </div>

      <div class="border-t border-border">
        <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 font-mono text-xs text-muted-foreground sm:flex-row lg:px-6">
          <div>© {{ new Date().getFullYear() }} ModelizeMe · Licence MIT · Construit avec <span class="text-emerald-500">Vue Flow</span></div>
          <div class="flex items-center gap-5">
            <a href="#" class="hover:text-foreground">Confidentialité</a>
            <a href="#" class="hover:text-foreground">Conditions</a>
            <a href="#" class="hover:text-foreground">Sécurité</a>
            <span class="inline-flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              tous les systèmes opérationnels
            </span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
