import prisma from "~/lib/prisma";
import { requireAdmin } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event);

  const query = getQuery(event);
  const id = idSchema.parse(query.id);

  // Prevent self-deletion
  if (id === session.user.id) {
    throw createError({
      statusCode: 400,
      message: "Vous ne pouvez pas supprimer votre propre compte",
    });
  }

  await prisma.user.delete({ where: { id } });

  return { success: true };
});
