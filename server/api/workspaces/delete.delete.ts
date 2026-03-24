import prisma from "~/lib/prisma";
import { requireAuth } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);

  const { id } = getQuery(event);
  const orgId = idSchema.parse(id);

  // Verify user is owner (has "owner" role in this org)
  const member = await prisma.member.findFirst({
    where: {
      organizationId: orgId,
      userId: session.user.id,
      role: "owner",
    },
  });

  if (!member) {
    throw createError({
      statusCode: 403,
      message: "Seul le propriétaire peut supprimer l'organisation",
    });
  }

  // Models are cascade-deleted via schema
  await prisma.organization.delete({ where: { id: orgId } });

  return { success: true };
});
