import prisma from "~/lib/prisma";
import { getServerSession } from "#auth";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const query = getQuery(event);

    // Récupérer uniquement la colonne pertinente en fonction de body.type
    const currentContent = await prisma.model.findUnique({
        where: { id: parseInt(query.id) },
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

    return await prisma.model.update({
        where: {
            id: parseInt(query.id),
        },
        data: updateData
    });
});
