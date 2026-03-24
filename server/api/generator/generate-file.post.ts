import prisma from '@/lib/prisma';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { title, database, nodes, edges } = body;

    try {

        // Créer un objet MLD
        const mld = { nodes: nodes, edges: edges};

        // Appeler l'API Laravel pour la génération du fichier sql
        return await $fetch(process.env.URL_BACKEND + '/api/generate-file', {
            method: 'POST',
            body: {
                title: title,
                database,
                mld
            },
            // Important : spécifier le type de réponse
            responseType: 'blob'
        });

    } catch (error) {
        console.error('Erreur lors de la génération du fichier SQL:', error);
        throw createError({
            statusCode: 400,
            statusMessage: 'Erreur lors de la génération du fichier SQL'
        });
    }
});