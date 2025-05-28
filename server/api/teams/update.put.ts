import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {

  const { id } = getQuery(event)
  const data = await readBody(event)
  if (!id) {
    throw createError({ statusCode: 400, message: 'id est requis' })
  }

  // Ici on ne met à jour que name (et éventuellement inviteCode)
  const updated = await prisma.team.update({
    where: { id: Number(id) },
    data: {
      name: data.name,
      inviteCode: data.inviteCode
    }
  })
  return updated
})
