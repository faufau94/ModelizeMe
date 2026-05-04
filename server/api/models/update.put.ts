// DEPRECATED - replaced by POST /api/models/events (event sourcing)
// Kept for backward compatibility during migration. Will be removed after Phase 3.
import prisma from "~/lib/prisma";
import { requireModelAccess } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const query = getQuery(event);
  const modelId = idSchema.parse(query.id);

  await requireModelAccess(event, modelId);

  const currentContent = await prisma.model.findUnique({
    where: { id: modelId },
    select: { nodes: true, edges: true },
  });

  if (!currentContent) {
    throw createError({ statusCode: 404, message: "Modèle non trouvé" });
  }

  const updateContent = (content: any[], newItem: any) => {
    const exists = content.some((item) => item.id === newItem.id);
    return exists
      ? content.map((item) => (item.id === newItem.id ? newItem : item))
      : [...content, newItem];
  };

  const updateData: Record<string, any> = {};

  if (body.type === "node" && body.node) {
    const nodes = (currentContent.nodes as any[]) || [];
    if (nodes.length >= 500) {
      throw createError({ statusCode: 400, message: "Limite de 500 nœuds atteinte" });
    }
    updateData.nodes = updateContent(nodes, body.node);
  }

  if (body.type === "edge" && body.edge) {
    const edges = (currentContent.edges as any[]) || [];
    if (edges.length >= 1000) {
      throw createError({ statusCode: 400, message: "Limite de 1000 arêtes atteinte" });
    }
    updateData.edges = updateContent(edges, body.edge);
  }

  if (body.teamId) {
    updateData.teamId = body.teamId;
  }

  return await prisma.model.update({
    where: { id: modelId },
    data: updateData,
  });
});
