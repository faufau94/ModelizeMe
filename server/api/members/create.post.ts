import { requireAuth } from "~/server/utils/auth";
import { auth } from "~/lib/auth";

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);

  const { email, organizationId, role } = await readBody(event);

  if (!email || !organizationId) {
    throw createError({
      statusCode: 400,
      message: "Email et organizationId sont requis",
    });
  }

  // Use better-auth invitation system
  const invitation = await auth.api.createInvitation({
    headers: event.headers,
    body: {
      email,
      organizationId,
      role: role || "member",
    },
  });

  return invitation;
});
