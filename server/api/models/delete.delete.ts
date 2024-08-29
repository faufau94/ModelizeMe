import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const query = getQuery(event);

    // Vérification du type de contenu et de l'action
    const isNode = body.type === 'node' && body.action === 'removeNode';
    const isEdge = body.type === 'edge' && body.action === 'removeEdge';
    console.log(isNode, isEdge);

    if (isNode || isEdge) {
        // Sélectionne la colonne appropriée en fonction du type
        const field = isNode ? 'nodes' : 'edges';
        const idField = isNode ? 'idNode' : 'idEdge';

        // Récupère le contenu actuel
        const currentContent = await prisma.model.findUnique({
            where: { id: parseInt(query.idModel) },
            select: { [field]: true },
        });

        if (!currentContent) {
            throw new Error('Modèle non trouvé');
        }

        // Filtre l'élément à supprimer
        const updatedContent = currentContent[field].filter(item => item.id !== query[idField]);

        // Met à jour le modèle avec le nouveau contenu
        return await prisma.model.update({
            where: { id: parseInt(query.idModel) },
            data: { [field]: updatedContent },
        });
    }

    // Suppression générale du modèle si aucune autre condition n'est remplie
    return await prisma.model.delete({
        where: { id: parseInt(query.id) },
    });
});
