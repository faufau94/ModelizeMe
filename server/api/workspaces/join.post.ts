import prisma from "~/lib/prisma";
import { requireAuth } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);

  const { invitationId } = await readBody(event);
  if (!invitationId) {
    throw createError({
      statusCode: 400,
      message: "ID d'invitation requis",
    });
  }

  // Find the invitation
  const invitation = await prisma.invitation.findUnique({
    where: { id: String(invitationId) },
  });

  if (!invitation) {
    throw createError({ statusCode: 404, message: "Invitation non trouvée" });
  }

  if (invitation.status !== "pending") {
    throw createError({ statusCode: 400, message: "Invitation déjà utilisée" });
  }

  if (new Date() > invitation.expiresAt) {
    throw createError({ statusCode: 400, message: "Invitation expirée" });
  }

  // Check if already a member
  const existingMember = await prisma.member.findFirst({
    where: {
      organizationId: invitation.organizationId,
      userId: session.user.id,
    },
  });

  if (existingMember) {
    throw createError({
      statusCode: 400,
      message: "Vous êtes déjà membre de cette organisation",
    });
  }

  // Create membership
  await prisma.member.create({
    data: {
      organizationId: invitation.organizationId,
      userId: session.user.id,
      role: invitation.role || "member",
      createdAt: new Date(),
    },
  });

  // Mark invitation as accepted
  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "accepted" },
  });

  return { success: true, organizationId: invitation.organizationId };
});
