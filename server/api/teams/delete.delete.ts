import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {

  const query = getQuery(event)
  const rawId = query.id;
  const id = Array.isArray(rawId) ? rawId[0] : String(rawId ?? '');
  if (!id) {
    throw createError({ statusCode: 400, message: 'id est requis' })
  }


    // Supprime d'abord les membres, puis l'équipe
    console.log(`Suppression des membres de l'équipe avec l'id: ${id}`);
  await prisma.teamMember.deleteMany({ where: { teamId: Number(id) } })
  await prisma.team.delete({ where: { id: Number(id) } })

  return { success: true }
})
