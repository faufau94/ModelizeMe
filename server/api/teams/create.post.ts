import prisma from "~/lib/prisma";
import { requireOrgMembership } from "~/server/utils/auth";
import { createTeamSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { name, organizationId, description, color, userId } = createTeamSchema.parse(body);

  const { session } = await requireOrgMembership(event, organizationId);

  const team = await prisma.team.create({
    data: {
      name,
      description,
      color,
      organizationId,
    },
  });

  // Add creator or specified user as first member
  const memberUserId = userId || session.user.id;
  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: memberUserId,
    },
  });

  return team;
});
