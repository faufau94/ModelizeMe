import prisma from "~/lib/prisma";
import {getServerSession} from "#auth";

export default defineEventHandler(async event => {

    const session = await getServerSession(event)


    const getCurrentUser = await prisma.user.findUnique({
        where: {
            email: session?.user?.email,
        }
    })

    return await prisma.model.findMany({
        where: {
            userId: getCurrentUser.id
        },
    })

});

