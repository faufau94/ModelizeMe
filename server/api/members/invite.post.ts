import { requireOrgRole } from "~/server/utils/auth";
import { auth } from "~/lib/auth";

export default defineEventHandler(async (event) => {
  const { email, organizationId, role } = await readBody(event);

  if (!email) {
    throw createError({
      statusCode: 400,
      message: "L'email est requis",
    });
  }

  if (!organizationId) {
    throw createError({
      statusCode: 400,
      message: "L'ID de l'organisation est requis",
    });
  }

  // Only owner/admin can invite members
  await requireOrgRole(event, organizationId, ["owner", "admin"]);

  // Use better-auth's invitation system
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
