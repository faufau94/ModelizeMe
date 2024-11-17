import prisma from '@/lib/prisma';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { projectName } = body;


    try {
        return await $fetch('http://modelizeme-generator.org/api/download-project', {
            method: 'POST',
            body: {
                projectName
            },
            responseType: 'blob',
        });
    } catch (error) {
        console.error('Erreur lors du téléchargement du projet via Laravel:', error);
        return {
            status: 400,
            message: 'Erreur lors du téléchargement du projet'
        };
    }
});
