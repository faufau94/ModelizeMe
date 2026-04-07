import prisma from "~/lib/prisma";
import { requireTeamOrgRole } from "~/server/utils/auth";
import { idSchema, updateTeamSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event);
  const teamId = idSchema.parse(id);
  const body = await readBody(event);
  const data = updateTeamSchema.parse(body);

  // Only owner/admin can update teams
  await requireTeamOrgRole(event, teamId, ["owner", "admin"]);

  return await prisma.team.update({
    where: { id: teamId },
    data,
  });
});
