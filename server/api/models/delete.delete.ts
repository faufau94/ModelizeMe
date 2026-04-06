import prisma from "~/lib/prisma";
import { requireModelAccess } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const query = getQuery(event);

  const isNode = body?.type === "node" && body?.action === "removeNode";
  const isEdge = body?.type === "edge" && body?.action === "removeEdge";

  if (isNode || isEdge) {
    const modelId = idSchema.parse(query.idModel);
    await requireModelAccess(event, modelId);

    const field = isNode ? "nodes" : "edges";
    const idField = isNode ? "idNode" : "idEdge";

    const currentContent = await prisma.model.findUnique({
      where: { id: modelId },
      select: { [field]: true },
    });

    if (!currentContent) {
      throw createError({ statusCode: 404, message: "Modèle non trouvé" });
    }

    const updatedContent = (currentContent[field] as any[]).filter(
      (item) => item.id !== query[idField]
    );

    return await prisma.model.update({
      where: { id: modelId },
      data: { [field]: updatedContent },
    });
  }

  // Full model deletion
  const modelId = idSchema.parse(query.id);
  await requireModelAccess(event, modelId);

  return await prisma.model.delete({
    where: { id: modelId },
  });
});
