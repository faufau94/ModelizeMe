import prisma from "~/lib/prisma";
import { requireAuth } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const { id } = getQuery(event);
  const teamId = idSchema.parse(id);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      teammembers: {
        include: { user: true },
      },
    },
  });

  if (!team) {
    throw createError({ statusCode: 404, message: "Équipe non trouvée" });
  }

  return team;
});
