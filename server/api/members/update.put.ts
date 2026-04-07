import prisma from "~/lib/prisma";
import { requireAuth } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);

  const { id } = getQuery(event);
  const memberId = idSchema.parse(id);
  const body = await readBody(event);

  // Find the member to get its orgId
  const member = await prisma.member.findUnique({
    where: { id: memberId },
  });

  if (!member) {
    throw createError({ statusCode: 404, message: "Membre non trouvé" });
  }

  // Check caller is owner/admin of this org
  const callerMember = await prisma.member.findFirst({
    where: {
      organizationId: member.organizationId,
      userId: session.user.id,
    },
  });

  if (!callerMember || !["owner", "admin"].includes(callerMember.role)) {
    throw createError({
      statusCode: 403,
      message: "Seuls les admins peuvent modifier les membres",
    });
  }

  // Admin cannot modify another admin or owner
  if (callerMember.role === "admin" && ["admin", "owner"].includes(member.role)) {
    throw createError({
      statusCode: 403,
      message: "Un admin ne peut pas modifier le rôle d'un autre admin ou du propriétaire",
    });
  }

  // Only allow updating role
  const updatedMember = await prisma.member.update({
    where: { id: memberId },
    data: {
      role: body.role || member.role,
    },
  });

  return updatedMember;
});
