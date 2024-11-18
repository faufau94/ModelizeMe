import prisma from '@/lib/prisma';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { title, modelId, framework, database, orm } = body;

    try {
        // Étape 1 : Récupérer le modèle dans la base de données à partir de modelId
        const model = await prisma.model.findUnique({
            where: { id: parseInt(modelId, 10) },
            select: { nodes: true, edges: true }
        });

        if (!model) {
            throw new Error('Modèle introuvable');
        }

        const mcd = { nodes: model.nodes, edges: model.edges };

        console.log('Génération du code...');
        // Étape 2 : Appeler l'API Lumen pour la génération du projet
        const response = await $fetch(process.env.URL_BACKEND + '/api/generate-project', {
            method: 'POST',
            body: {
                title: title.replace(/ /g, '-'),
                framework,
                database,
                orm,
                mcd
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
