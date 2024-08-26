import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {

    const body = await readBody(event)
    const query = getQuery(event)

    if(body.type === 'node' && body.action === 'removeNode') {

        const currentContent = await prisma.model.findUnique({
            where: { id: parseInt(query.idModel) },
            select: {
                nodes: true,
            }
        });

        if (!currentContent) {
            throw new Error('Modèle non trouvé');
        }

        const updatedNodes = currentContent.nodes.filter(node => node.id !== query.idNode);


        return await prisma.model.update({
            where: {
                id: parseInt(query.idModel),
            },
            data: {
                nodes: updatedNodes
            }
        })
    }


    return await prisma.model.delete({
        where: {
            id: parseInt(query.id),
        },
    })

})