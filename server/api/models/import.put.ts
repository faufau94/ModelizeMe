import prisma from "~/lib/prisma";
import { requireModelAccess } from "~/server/utils/auth";
import { buildModelState, maybeCreateSnapshot } from "~/server/utils/event-engine";
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
  const { session } = await requireModelAccess(event, modelId);

  // Use reconstructed state for accurate limit checks
  const currentState = await buildModelState(modelId);
  const newNodes = Array.isArray(body.nodes) ? body.nodes : [];
  const newEdges = Array.isArray(body.edges) ? body.edges : [];

  if (currentState.nodes.length + newNodes.length > 500) {
    throw createError({ statusCode: 400, message: "Limite de 500 nœuds dépassée" });
  }
  if (currentState.edges.length + newEdges.length > 1000) {
    throw createError({ statusCode: 400, message: "Limite de 1000 arêtes dépassée" });
  }

  // Insert MODEL_IMPORTED event
  const modelEvent = await prisma.modelEvent.create({
    data: {
      modelId,
      type: "MODEL_IMPORTED",
      payload: { nodes: newNodes, edges: newEdges },
      inverse: null,
      userId: session.user.id,
      undoable: false,
    },
  });

  // Double-write: update Model.nodes/edges for backward compatibility
  const mergedNodes = [...currentState.nodes, ...newNodes];
  const mergedEdges = [...currentState.edges, ...newEdges];

  const updated = await prisma.model.update({
    where: { id: modelId },
    data: { nodes: mergedNodes, edges: mergedEdges },
  });

  // Async snapshot
  maybeCreateSnapshot(modelId, modelEvent.id).catch(() => {});

  return updated;
});
