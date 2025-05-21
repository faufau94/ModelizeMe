import prisma from "~/lib/prisma";

export default defineEventHandler(async event => {
  const { id } = getQuery(event);
  console.log('id', id);
  

    return await prisma.workspace.findUnique({
        where: {
            id: parseInt(id),
        }
    })
})