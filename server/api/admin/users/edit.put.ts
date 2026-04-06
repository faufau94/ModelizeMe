import prisma from "~/lib/prisma";
import { requireAdmin } from "~/server/utils/auth";
import { idSchema, editUserSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = getQuery(event);
  const id = idSchema.parse(query.id);
  const body = await readBody(event);
  const data = editUserSchema.parse(body);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw createError({ statusCode: 404, message: "Utilisateur non trouvé" });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
    },
  });

  return updatedUser;
});
