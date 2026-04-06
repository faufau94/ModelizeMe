import prisma from "~/lib/prisma";
import { requireOrgMembership } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const { selectedWorkspaceId, teamId, onlyTemplates } = getQuery(event);
  const workspaceId = idSchema.parse(selectedWorkspaceId);

  await requireOrgMembership(event, workspaceId);

  const isTemplates = onlyTemplates === "true";

  const where: any = {
    workspaceId,
    ...(teamId && { teamId: String(teamId) }),
    ...(isTemplates && { Galery: { some: {} } }),
  };

  return await prisma.model.findMany({
    where,
    include: {
      team: true,
      author: {
        select: {
          name: true,
          image: true,
        },
      },
      ...(isTemplates && {
        Galery: {
          include: { category: true },
        },
      }),
    },
  });
});
