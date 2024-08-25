import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {

    const query = getQuery(event)


    return await prisma.model.delete({
        where: {
            id: parseInt(query.id),
        },
    })

})