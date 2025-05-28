import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {

  const { workspaceId, name, description, maxMembers } = await readBody(event)
  if (!workspaceId || !name) {
    throw createError({ statusCode: 400, message: 'workspaceId et name sont requis' })
  }

  const team = await prisma.team.create({
    data: {
      name,
      description,
      maxMembers,
      workspaceId: String(workspaceId),
    }
  })
  return team
})
