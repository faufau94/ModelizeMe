import prisma from '~/lib/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const teamId = query.teamId as string
  const userId = query.userId as string

  if (!teamId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'teamId is required',
    })
  }

    if (!userId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'userId is required',
        })
    }

  return prisma.teamMember.delete({
        where: {
            teamId_userId: {
                teamId: String(teamId),
                userId: String(userId),
            }
        }
  });
})
