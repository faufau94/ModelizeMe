import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { workspaceId } = getQuery(event)
  if (!workspaceId) {
    throw createError({ statusCode: 400, message: 'workspaceId est requis' })
  }

  return await prisma.team.findMany({
    where: { workspaceId: String(workspaceId) },
    include: {
      members: {
        include: { user: true }
      }
    }
  })
})
