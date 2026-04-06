import prisma from "~/lib/prisma";
import { requireOrgMembership } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const { workspaceId } = getQuery(event);
  const parsedWorkspaceId = idSchema.parse(workspaceId);

  await requireOrgMembership(event, parsedWorkspaceId);

  return await prisma.generatedProject.findMany({
    where: { workspaceId: parsedWorkspaceId },
    include: {
      model: {
        select: { id: true, name: true },
      },
      author: {
        select: { name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
});
