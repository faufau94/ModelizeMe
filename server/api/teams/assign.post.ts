import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {

  const { id: teamId } = getQuery(event)
  const { assignments } = await readBody(event)
  if (!teamId) {
    throw createError({ statusCode: 400, message: 'teamId est requis' })
  }
  if (!Array.isArray(assignments)) {
    throw createError({ statusCode: 400, message: 'assignments doit être un tableau' })
  }

  // 1) On supprime les assignations existantes
  await prisma.teamMember.deleteMany({ where: { teamId: Number(teamId) } })

  // 2) On recrée les nouvelles
  if (assignments.length > 0) {
    await prisma.teamMember.createMany({
      data: assignments.map((a: any) => ({
        teamId: Number(teamId),
        userId: Number(a.userId),
        canViewOthers: a.canViewOthers ? 1 : 0
      }))
    })
  }

  // 3) Retourne l’équipe à jour
  const team = await prisma.team.findUnique({
    where: { id: Number(teamId) },
    include: {
      members: { include: { user: true } }
    }
  })
  if (!team) {
    throw createError({ statusCode: 404, message: 'Équipe non trouvée après assignation' })
  }
  return team
})
