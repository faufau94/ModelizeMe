import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const query = getQuery(event);

    console.log('Update Model:', body);

    // Récupérer uniquement la colonne pertinente en fonction de body.type
    const currentContent = await prisma.model.findUnique({
        where: { id: query.id?.toString() },
        select: {
            nodes: true,
            edges: true,
        }
    });

    if (!currentContent) {
        throw new Error('Modèle non trouvé');
    }

    // Préparer les données à mettre à jour
    const updateContent = (content, newItem) => {
        const exists = content.some(item => item.id === newItem.id);
        return exists
            ? content.map(item => item.id === newItem.id ? newItem : item)
            : [...content, newItem];
    };

    const updateData = {};

    if (body.type === 'node') {
        updateData.nodes = updateContent(currentContent.nodes || [], body.node);
    }

    if (body.type === 'edge') {
        updateData.edges = updateContent(currentContent.edges || [], body.edge);
    }

    // check if body contains teamId
    if (body.teamId) {
        updateData.teamId = body.teamId;
    }



    return await prisma.model.update({
        where: {
            id: query.id?.toString(),
        },
        data: updateData
    });
});
