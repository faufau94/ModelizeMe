import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const { nodes_mld, edges_mld } = await readBody(event);
    const query = getQuery(event);

    return await prisma.model.update({
        where: {
            id: parseInt(query.id),
        },
        data: {
            nodes_mld: nodes_mld,
            edges_mld: edges_mld,
        },
    });
});
