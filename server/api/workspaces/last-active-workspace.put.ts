import { requireAuth } from "~/server/utils/auth";
import { auth } from "~/lib/auth";

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);

  const { workspaceId } = getQuery(event);
  if (!workspaceId || typeof workspaceId !== "string") {
    throw createError({ statusCode: 400, message: "workspaceId requis" });
  }

  // Update active organization on the session via better-auth
  await auth.api.setActiveOrganization({
    headers: event.headers,
    body: { organizationId: workspaceId },
  });

  return { success: true };
});
