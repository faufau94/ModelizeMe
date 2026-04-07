import prisma from "~/lib/prisma";
import { requireTeamOrgRole } from "~/server/utils/auth";
import { idSchema, renameTeamSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const teamId = idSchema.parse(query.id);
  const body = await readBody(event);
  const { name } = renameTeamSchema.parse(body);

  // Only owner/admin can rename teams
  await requireTeamOrgRole(event, teamId, ["owner", "admin"]);

  return await prisma.team.update({
    where: { id: teamId },
    data: { name },
  });
});
