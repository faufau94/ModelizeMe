import prisma from "~/lib/prisma";
import {getServerSession} from "#auth";

export default defineEventHandler(async (event) => {
    const body = readBody(event)
    const session = await getServerSession(event)

    console.log(session)

    const updateUser = await prisma.model.update({
        where: {
            id: '',
            userId: session?.user?.id,
        },
        data: {
            content: body
        },
    })
})
