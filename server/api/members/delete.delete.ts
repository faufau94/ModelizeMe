import prisma from "~/lib/prisma";
import { requireAuth } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);

  const { userId, workspaceId } = getQuery(event);
  const targetUserId = idSchema.parse(userId);
  const orgId = idSchema.parse(workspaceId);

  // Check caller is an owner/admin of this org
  const callerMember = await prisma.member.findFirst({
    where: {
      organizationId: orgId,
      userId: session.user.id,
    },
  });

  if (!callerMember || !["owner", "admin"].includes(callerMember.role)) {
    throw createError({
      statusCode: 403,
      message: "Seuls les admins peuvent retirer des membres",
    });
  }

  // Cannot remove the owner
  const targetMember = await prisma.member.findFirst({
    where: {
      organizationId: orgId,
      userId: targetUserId,
    },
  });

  if (!targetMember) {
    throw createError({ statusCode: 404, message: "Membre non trouvé" });
  }

  if (targetMember.role === "owner") {
    throw createError({
      statusCode: 400,
      message: "Impossible de retirer le propriétaire",
    });
  }

  await prisma.member.delete({ where: { id: targetMember.id } });

  return { success: true };
});
