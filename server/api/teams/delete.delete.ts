import prisma from "~/lib/prisma";
import { requireAuth } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const query = getQuery(event);
  const id = idSchema.parse(query.id);

  // Cascade delete handles teamMembers automatically
  await prisma.team.delete({ where: { id } });

  return { success: true };
});
