import prisma from "~/lib/prisma";
import { requireAdmin } from "~/server/utils/auth";
import { createCategorySchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = await readBody(event);
  const { name } = createCategorySchema.parse(body);

  return await prisma.category.create({
    data: { name },
  });
});
