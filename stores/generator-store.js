import { defineStore } from "pinia";
import { ref, computed } from "vue";

/**
 * Framework registry — single source of truth for all framework configurations
 * Adding a new framework = add one entry here, nothing else needs to change
 */
const FRAMEWORK_REGISTRY = {
  django: {
    name: "Django",
    logoName: "django",
    description: "Framework web Python avec administration.",
    orms: [
      {
        name: "Django ORM",
        value: "django_orm",
        logoName: "django",
        description: "ORM natif de Django.",
      },
      {
        name: "SQLAlchemy",
        value: "sqlalchemy",
        logoName: "sqlalchemy",
        description: "ORM puissant et flexible pour Python.",
      },
    ],
  },
  laravel: {
    name: "Laravel",
    logoName: "laravel",
    description: "Framework PHP elegant pour le developpement web rapide.",
    orms: [
      {
        name: "Eloquent",
        value: "eloquent",
        logoName: "laravel",
        description: "ORM intuitif integre a Laravel.",
      },
    ],
  },
  nuxt: {
    name: "Nuxt.js",
    logoName: "nuxt",
    description: "Framework Vue.js pour applications universelles.",
    orms: [
      {
        name: "Prisma",
        value: "prisma",
        logoName: "prisma",
        description: "ORM moderne pour Node.js et TypeScript.",
      },
      {
        name: "TypeORM",
        value: "typeorm",
        logoName: "typeorm",
        description: "ORM robuste pour TypeScript/JavaScript.",
      },
    ],
  },
  // next: {
  //   name: "Next.js",
  //   logoName: "next",
  //   comingSoon: true,
  //   description: "Framework React avec rendu cote serveur.",
  //   orms: [
  //     {
  //       name: "Prisma",
  //       value: "prisma",
  //       logoName: "prisma",
  //       description: "ORM moderne pour Node.js et TypeScript.",
  //     },
  //     {
  //       name: "TypeORM",
  //       value: "typeorm",
  //       logoName: "typeorm",
  //       description: "ORM robuste pour TypeScript/JavaScript.",
  //     },
  //   ],
  // },
  // vite: {
  //   name: "Vite",
  //   logoName: "vite",
  //   comingSoon: true,
  //   description: "Outil de build rapide pour projets frontend modernes.",
  //   orms: [
  //     {
  //       name: "Prisma",
  //       value: "prisma",
  //       logoName: "prisma",
  //       description: "ORM moderne pour Node.js et TypeScript.",
  //     },
  //     {
  //       name: "TypeORM",
  //       value: "typeorm",
  //       logoName: "typeorm",
  //       description: "ORM robuste pour TypeScript/JavaScript.",
  //     },
  //   ],
  // },
  // symfony: {
  //   name: "Symfony",
  //   logoName: "symfony",
  //   comingSoon: true,
  //   description: "Framework PHP complet avec une vaste communaute.",
  //   orms: [
  //     {
  //       name: "Doctrine",
  //       value: "doctrine",
  //       logoName: "doctrine",
  //       description: "ORM robuste pour Symfony.",
  //     },
  //   ],
  // },
};

/**
 * Database options — static list, independent of framework
 */
const DATABASE_OPTIONS = [
  {
    name: "PostgreSQL",
    value: "postgresql",
    logoName: "postgresql",
    description: "Base de donnees relationnelle avancee.",
  },
  {
    name: "MySQL",
    value: "mysql",
    logoName: "mysql",
    description: "Base de donnees open-source performante.",
  },
  {
    name: "SQLite",
    value: "sqlite",
    logoName: "sqlite",
    description: "Base de donnees legere integree.",
  },
];

/**
 * Steps definition — derived from FRAMEWORK_REGISTRY and DATABASE_OPTIONS
 * Never write this manually; it''s automatically generated from the above configs
 */
export const STEPS = [
  {
    step: 1,
    title: "Informations principales",
  },
  {
    step: 2,
    title: "Framework",
    field: "framework",
    options: Object.entries(FRAMEWORK_REGISTRY).map(([value, fw]) => ({
      value,
      name: fw.name,
      logoName: fw.logoName,
      description: fw.description,
      ...(fw.comingSoon ? { comingSoon: true } : {}),
    })),
  },
  {
    step: 3,
    title: "ORM",
    field: "orm",
    // options resolved dynamically via ormOptions computed in the store
  },
  {
    step: 4,
    title: "Base de donnees",
    field: "database",
    options: DATABASE_OPTIONS,
  },
];

export const useCodeGeneratorStore = defineStore("generator", () => {
  const stepIndex = ref(1);
  const datas = ref({
    title: "",
    description: "",
    modelId: "",
    framework: "",
    database: "",
    orm: "",
  });

  // Resolved ORM options based on selected framework
  const ormOptions = computed(
    () => FRAMEWORK_REGISTRY[datas.value.framework]?.orms ?? []
  );

  return {
    stepIndex,
    datas,
    ormOptions,
  };
});