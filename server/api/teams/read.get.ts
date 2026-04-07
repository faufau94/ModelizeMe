import prisma from "~/lib/prisma";
import { requireTeamOrgMembership } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event);
  const teamId = idSchema.parse(id);

  // Verify user is a member of the team's organization
  await requireTeamOrgMembership(event, teamId);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      teammembers: {
        include: { user: true },
      },
    },
  });

  if (!team) {
    throw createError({ statusCode: 404, message: "Équipe non trouvée" });
  }

  return team;
});
