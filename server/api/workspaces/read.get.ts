import prisma from "~/lib/prisma";
import { requireOrgMembership } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const { workspaceId } = getQuery(event);
  const orgId = idSchema.parse(workspaceId);

  await requireOrgMembership(event, orgId);

  return await prisma.organization.findUnique({
    where: { id: orgId },
  });
});
