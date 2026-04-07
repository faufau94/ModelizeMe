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

  // Full model deletion — only owner/admin or model author can delete
  const modelId = idSchema.parse(query.id);
  const { session, model, member } = await requireModelAccess(event, modelId);

  const isOwnerOrAdmin = ["owner", "admin"].includes(member.role);
  const isAuthor = model.authorId === session.user.id;

  if (!isOwnerOrAdmin && !isAuthor) {
    throw createError({
      statusCode: 403,
      message: "Seuls les admins ou l'auteur du modèle peuvent le supprimer",
    });
  }

  return await prisma.model.delete({
    where: { id: modelId },
  });
});
