import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {

  const { id } = getQuery(event)
  if (!id) {
    throw createError({ statusCode: 400, message: 'id est requis' })
  }

  // Supprime d'abord les membres, puis l'équipe
  await prisma.teamMember.deleteMany({ where: { teamId: Number(id) } })
  await prisma.team.delete({ where: { id: Number(id) } })

  return { success: true }
})
