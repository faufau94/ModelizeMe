import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {

    const query = getQuery(event)

    console.log(query)

    const deleteUser = await prisma.model.delete({
        where: {
            id: parseInt(query.id),
        },
    })

    console.log('deleteUser', deleteUser)

    return deleteUser

})