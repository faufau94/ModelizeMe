import prisma from "~/lib/prisma";
import { requireAuth } from "~/server/utils/auth";
import { idSchema, renameTeamSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const query = getQuery(event);
  const teamId = idSchema.parse(query.id);
  const body = await readBody(event);
  const { name } = renameTeamSchema.parse(body);

  return await prisma.team.update({
    where: { id: teamId },
    data: { name },
  });
});
