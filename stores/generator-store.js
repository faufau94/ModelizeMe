import { defineStore } from "pinia";
import { ref, computed } from "vue";

/**
 * UI metadata for frameworks, ORMs and databases.
 * The backend provides the source of truth for what's available (via /api/capabilities).
 * This map only adds display info (logos, descriptions) that the backend doesn't know about.
 */
const FRAMEWORK_META = {
  django: {
    name: "Django",
    logoName: "django",
    description: "Framework web Python avec administration.",
  },
  laravel: {
    name: "Laravel",
    logoName: "laravel",
    description: "Framework PHP elegant pour le developpement web rapide.",
  },
  nuxt: {
    name: "Nuxt.js",
    logoName: "nuxt",
    description: "Framework Vue.js pour applications universelles.",
  },
};

const ORM_META = {
  django_orm: {
    name: "Django ORM",
    logoName: "django",
    description: "ORM natif de Django.",
  },
  sqlalchemy: {
    name: "SQLAlchemy",
    logoName: "sqlalchemy",
    description: "ORM puissant et flexible pour Python.",
  },
  eloquent: {
    name: "Eloquent",
    logoName: "laravel",
    description: "ORM intuitif integre a Laravel.",
  },
  prisma: {
    name: "Prisma",
    logoName: "prisma",
    description: "ORM moderne pour Node.js et TypeScript.",
  },
  typeorm: {
    name: "TypeORM",
    logoName: "typeorm",
    description: "ORM robuste pour TypeScript/JavaScript.",
  },
  doctrine: {
    name: "Doctrine",
    logoName: "doctrine",
    description: "ORM robuste pour Symfony.",
  },
};

const DATABASE_META = {
  postgresql: {
    name: "PostgreSQL",
    logoName: "postgresql",
    description: "Base de donnees relationnelle avancee.",
  },
  mysql: {
    name: "MySQL",
    logoName: "mysql",
    description: "Base de donnees open-source performante.",
  },
  sqlite: {
    name: "SQLite",
    logoName: "sqlite",
    description: "Base de donnees legere integree.",
  },
};

export const useCodeGeneratorStore = defineStore("generator", () => {
  const stepIndex = ref(1);
  const datas = ref({
    title: "",
    description: "",
    modelId: "",
    framework: "",
    database: "",
    orm: "",
    packages: [],
  });

  // Capabilities loaded from backend
  const capabilities = ref(null);
  const capabilitiesLoaded = ref(false);

  async function loadCapabilities() {
    if (capabilitiesLoaded.value) return;
    try {
      const response = await $fetch("/api/generator/capabilities");
      capabilities.value = response.frameworks;
      capabilitiesLoaded.value = true;
    } catch (error) {
      console.error("Failed to load capabilities:", error);
    }
  }

  // Framework options for step 2
  const frameworkOptions = computed(() => {
    if (!capabilities.value) return [];
    return Object.entries(capabilities.value).map(([key, fw]) => {
      const meta = FRAMEWORK_META[key] || {};
      return {
        value: key,
        name: meta.name || key,
        logoName: meta.logoName || key,
        description: meta.description || "",
        version: fw.version,
      };
    });
  });

  // ORM options for step 3 — filtered by selected framework
  const ormOptions = computed(() => {
    const fw = datas.value.framework;
    if (!fw || !capabilities.value?.[fw]) return [];
    return Object.entries(capabilities.value[fw].orms).map(([ormKey, ormData]) => {
      const meta = ORM_META[ormKey] || {};
      return {
        value: ormKey,
        name: meta.name || ormKey,
        logoName: meta.logoName || ormKey,
        description: meta.description || "",
        version: ormData?.version ?? null,
      };
    });
  });

  // Database options for step 4 — filtered by selected framework
  const databaseOptions = computed(() => {
    const fw = datas.value.framework;
    if (!fw || !capabilities.value?.[fw]) return [];
    return Object.entries(capabilities.value[fw].databases).map(([dbKey, dbData]) => {
      const meta = DATABASE_META[dbKey] || {};
      return {
        value: dbKey,
        name: meta.name || dbKey,
        logoName: meta.logoName || dbKey,
        description: meta.description || "",
        version: dbData?.version ?? null,
      };
    });
  });

  // Package options for step 5 — filtered by selected framework
  const packageOptions = computed(() => {
    const fw = datas.value.framework;
    if (!fw || !capabilities.value?.[fw]) return [];
    const packages = capabilities.value[fw].packages;
    if (!packages || typeof packages !== "object") return [];
    return Object.entries(packages).map(([key, pkg]) => ({
      value: key,
      name: pkg.label || key,
      description: pkg.description || "",
      logoName: key,
    }));
  });

  // Steps definition — built dynamically
  const STEPS = computed(() => {
    const steps = [
      { step: 1, title: "Informations principales" },
      { step: 2, title: "Framework", field: "framework", options: frameworkOptions.value },
      { step: 3, title: "ORM", field: "orm" },
      { step: 4, title: "Base de donnees", field: "database" },
    ];

    if (packageOptions.value.length > 0) {
      steps.push({ step: 5, title: "Packages", field: "packages" });
    }

    return steps;
  });

  return {
    stepIndex,
    datas,
    capabilities,
    capabilitiesLoaded,
    loadCapabilities,
    frameworkOptions,
    ormOptions,
    databaseOptions,
    packageOptions,
    STEPS,
  };
});
