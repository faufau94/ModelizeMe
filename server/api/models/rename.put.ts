import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const query = getQuery(event)


    const updateModelName = await prisma.model.update({
        where: {
            id: query.id?.toString(),
        },
        data: {
            name: body.name
        },
    })
    return updateModelName
})
