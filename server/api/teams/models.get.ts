import prisma from "~/lib/prisma";
import { requireAuth } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const query = getQuery(event);
  const teamId = idSchema.parse(query.teamId);

  return await prisma.model.findMany({
    where: { teamId },
    select: {
      id: true,
      name: true,
    },
  });
});
