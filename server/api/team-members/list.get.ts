import prisma from "~/lib/prisma";
import { requireTeamOrgMembership } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const teamId = idSchema.parse(query.teamId);

  // Verify user is a member of the team's organization
  await requireTeamOrgMembership(event, teamId);

  return await prisma.teamMember.findMany({
    where: { teamId },
    select: {
      id: true,
      userId: true,
      teamId: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
});
