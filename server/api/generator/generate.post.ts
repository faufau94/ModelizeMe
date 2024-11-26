import prisma from '@/lib/prisma';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { title, modelId, framework, database, orm, nodes, edges } = body;

    try {

        // Créer un objet MLD
        const mld = { nodes: nodes, edges: edges};

        console.log('Génération du code...');
        // Étape 2 : Appeler l'API Lumen pour la génération du projet
        const response = await $fetch(process.env.URL_BACKEND + '/api/generate-project', {
            method: 'POST',
            body: {
                title: title.replace(/ /g, '-'),
                framework,
                database,
                orm,
                mld
            }
        });
        console.log(response)

        if(response.status === 'success') {
            return {
                status: 200,
                projectName: response.projectName
            }
        } else {
            return {
                status: 400,
            };
        }
    } catch (error) {
        console.error('Erreur lors de la génération du projet via Laravel:', error);
        return {
            status: 400,
            message: 'Erreur lors de la génération du projet'
        };
    }
});
