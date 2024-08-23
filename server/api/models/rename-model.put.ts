import prisma from "~/lib/prisma";
import {getServerSession} from "#auth";

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    const query = getQuery(event)

    console.log(query.id)
    console.log(body)

    const updateModelName = await prisma.model.update({
        where: {
            id: parseInt(query.id),
        },
        data: {
            name: body.name
        },
    })
    console.log(updateModelName)
    return updateModelName
})
