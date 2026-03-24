import { requireAuth } from "~/server/utils/auth";
import { auth } from "~/lib/auth";

export default defineEventHandler(async (event) => {
  // Invitation management is now handled by better-auth's organization plugin.
  // This route is kept for backward compatibility but the invite flow
  // should use auth.api.createInvitation() instead.
  await requireAuth(event);

  throw createError({
    statusCode: 410,
    message: "Cette route est dépréciée. Utilisez le système d'invitation de better-auth.",
  });
});
