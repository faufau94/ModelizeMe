import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const query = getQuery(event)


    const updateTeamName = await prisma.team.update({
        where: {
            id: parseInt(query.id),
        },
        data: {
            name: body.name
        },
    })
    return updateTeamName
})
