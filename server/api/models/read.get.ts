import prisma from "~/lib/prisma";

export default defineEventHandler(async event => {
  const { id } = getQuery(event);

    const model = await prisma.model.findUnique({
        where: {
            id: parseInt(id),
        }
    })

    console.log('model', model)
    const { nodes, edges } = model

    console.log('nodes', nodes)
    console.log('edges', edges)
    return {
        nodes: nodes,
        edges: edges
    }
})