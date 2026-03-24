import prisma from "~/lib/prisma";
import { requireModelAccess } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event);
  const modelId = idSchema.parse(id);

  await requireModelAccess(event, modelId);

  const model = await prisma.model.findUnique({
    where: { id: modelId },
  });

  if (!model) {
    throw createError({ statusCode: 404, message: "Modèle non trouvé" });
  }

  return model;
});
