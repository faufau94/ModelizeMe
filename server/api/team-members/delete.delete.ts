import prisma from "~/lib/prisma";
import { requireTeamOrgRole } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const teamId = idSchema.parse(query.teamId);
  const userId = idSchema.parse(query.userId);

  // Only owner/admin of the team's organization can remove team members
  await requireTeamOrgRole(event, teamId, ["owner", "admin"]);

  return await prisma.teamMember.delete({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  });
});
