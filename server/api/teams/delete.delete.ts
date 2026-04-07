import prisma from "~/lib/prisma";
import { requireTeamOrgRole } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const id = idSchema.parse(query.id);

  // Only owner/admin of the team's organization can delete
  await requireTeamOrgRole(event, id, ["owner", "admin"]);

  // Cascade delete handles teamMembers automatically
  await prisma.team.delete({ where: { id } });

  return { success: true };
});
