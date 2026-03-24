import prisma from "~/lib/prisma";
import { requireAuth } from "~/server/utils/auth";
import { idSchema, updateTeamSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const { id } = getQuery(event);
  const teamId = idSchema.parse(id);
  const body = await readBody(event);
  const data = updateTeamSchema.parse(body);

  return await prisma.team.update({
    where: { id: teamId },
    data,
  });
});
