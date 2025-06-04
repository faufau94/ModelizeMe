import prisma from "~/lib/prisma";

export default defineEventHandler(async event => {
  const { id } = getQuery(event);

    return await prisma.model.findUnique({
        where: {
            id: id?.toString(),
        }
    })
})