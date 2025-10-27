import prisma from '~/lib/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const teamId = query.teamId as string

  if (!teamId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'teamId is required',
    })
  }

  return prisma.model.findMany({
      where: {teamId},
      select: {
          id: true,
          name: true,
      },
  });
})
