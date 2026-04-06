import prisma from "~/lib/prisma";
import { requireAuth } from "~/server/utils/auth";
import { createGalerySchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);

  const body = await readBody(event);
  const { modelId, categoryId } = createGalerySchema.parse({
    ...body,
    userId: session.user.id,
  });

  return await prisma.galery.create({
    data: {
      model: { connect: { id: modelId } },
      category: { connect: { id: categoryId } },
      user: { connect: { id: session.user.id } },
    },
  });
});
