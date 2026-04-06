import prisma from "~/lib/prisma";
import { requireOrgMembership } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const { workspaceId } = getQuery(event);
  const orgId = idSchema.parse(workspaceId);

  await requireOrgMembership(event, orgId);

  const members = await prisma.member.findMany({
    where: { organizationId: orgId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return members;
});
