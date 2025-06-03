import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {

  const { id } = getQuery(event)
  if (!id) {
    throw createError({ statusCode: 400, message: 'id est requis' })
  }

  const team = await prisma.team.findUnique({
    where: { id: Number(id) },
    include: {
      members: {
        include: { user: true }
      }
    }
  })
  if (!team) {
    throw createError({ statusCode: 404, message: 'Équipe non trouvée' })
  }
  return team
})
