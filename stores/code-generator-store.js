import {defineStore} from "pinia";
import {ref} from "vue";

export const useCodeGeneratorStore = defineStore('code-generator', () => {

    const stepIndex = ref(1)
    const datas = ref({
        title: '',
        description: '',
        framework: '',
        database: '',
        orm: '',
    })
    const steps = ref([
        {
            step: 1,
            title: 'Informations principales',
            description: '',
        },
        {
            step: 2,
            title: 'Framework',
            description: '',
            options: [
                {
                    name: 'Django',
                    value: 'django',
                    logoName: 'django',
                    description: 'Framework web Python avec administration prête à l’emploi.'
                },
                {
                    name: 'Laravel',
                    value: 'laravel',
                    logoName: 'laravel',
                    description: 'Framework PHP élégant pour le développement web rapide.'
                },
                {
                    name: 'Vite',
                    value: 'vite',
                    comingSoon: true,
                    logoName: 'vite',
                    description: 'Outil de build rapide pour projets frontend modernes.'
                },
                {
                    name: 'Next.js',
                    value: 'next',
                    comingSoon: true,
                    logoName: 'next',
                    description: 'Framework React avec rendu côté serveur.'
                },
                {
                    name: 'Nuxt.js',
                    value: 'nuxt',
                    comingSoon: true,
                    logoName: 'nuxt',
                    description: 'Framework Vue.js pour applications universelles.'
                },
                {
                    name: 'Symfony',
                    value: 'symfony',
                    comingSoon: true,
                    logoName: 'symfony',
                    description: 'Framework PHP complet avec une vaste communauté.'
                },
            ],
        },
        {
            step: 3,
            title: 'ORM',
            description: '',
            options: (framework) => {
                switch (framework) {
                    case 'django':
                        return [{
                            name: 'SQLAlchemy',
                            value: 'sqlalchemy',
                            logoName: 'sqlalchemy',
                            description: 'ORM puissant et flexible pour Python.'
                        }];
                    case 'laravel':
                        return [{
                            name: 'Eloquent',
                            value: 'eloquent',
                            logoName: 'laravel',
                            description: 'ORM intuitif intégré à Laravel.'
                        }];
                    case 'vite':
                    case 'next':
                    case 'nuxt':
                        return [
                            {
                                name: 'Prisma',
                                value: 'prisma',
                                logoName: 'prisma',
                                description: 'ORM moderne pour Node.js et TypeScript.'
                            },
                            {
                                name: 'TypeORM',
                                value: 'typeorm',
                                logoName: 'typeorm',
                                description: 'ORM robuste pour TypeScript/JavaScript.'
                            },
                        ];
                    case 'symfony':
                        return [{
                            name: 'Doctrine',
                            value: 'doctrine',
                            logoName: 'doctrine',
                            description: 'ORM robuste pour Symfony.'
                        }];
                    default:
                        return [];
                }
            },
        },
        {
            step: 4,
            title: 'Base de données',
            description: '',
            options: [
                {
                    name: 'PostgreSQL',
                    value: 'postgres',
                    logoName: 'postgresql',
                    description: 'Base de données relationnelle avancée.'
                },
                {
                    name: 'MySQL',
                    value: 'mysql',
                    logoName: 'mysql',
                    description: 'Base de données open-source performante.'
                },
                {name: 'SQLite', value: 'sqlite', logoName: 'sqlite', description: 'Base de données légère intégrée.'},
            ],
        },
    ])

    return {
        stepIndex,
        datas,
        steps,
    }
})
