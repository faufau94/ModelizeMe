import prisma from "~/lib/prisma";
import {getServerSession} from "#auth";

export default defineEventHandler(async event => {

    const { title } = await readBody(event);

    const session = await getServerSession(event)


    const getCurrentUser = await prisma.user.findUnique({
      where: {
        email: session?.user?.email,
      }
    })

    const newModel = await prisma.model.create({
        data: {
            name: title,
            userId: getCurrentUser.id,
        },
    })

    return newModel
});