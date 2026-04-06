import prisma from "~/lib/prisma";
import { requireAuth } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const query = getQuery(event);
  const teamId = idSchema.parse(query.teamId);
  const userId = idSchema.parse(query.userId);

  return await prisma.teamMember.delete({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  });
});
