import prisma from "~/lib/prisma";
import { requireModelAccess } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.modelId || !body.nodes || !body.edges) {
    throw createError({
      statusCode: 400,
      message: "modelId, nodes et edges sont requis",
    });
  }

  const modelId = idSchema.parse(body.modelId);
  await requireModelAccess(event, modelId);

  const existingModel = await prisma.model.findUnique({
    where: { id: modelId },
  });

  if (!existingModel) {
    throw createError({ statusCode: 404, message: "Modèle introuvable" });
  }

  const existingNodes = (existingModel.nodes as any[]) || [];
  const existingEdges = (existingModel.edges as any[]) || [];
  const newNodes = Array.isArray(body.nodes) ? body.nodes : [];
  const newEdges = Array.isArray(body.edges) ? body.edges : [];

  if (existingNodes.length + newNodes.length > 500) {
    throw createError({ statusCode: 400, message: "Limite de 500 nœuds dépassée" });
  }
  if (existingEdges.length + newEdges.length > 1000) {
    throw createError({ statusCode: 400, message: "Limite de 1000 arêtes dépassée" });
  }

  return await prisma.model.update({
    where: { id: modelId },
    data: {
      nodes: [...existingNodes, ...newNodes],
      edges: [...existingEdges, ...newEdges],
    },
  });
});
