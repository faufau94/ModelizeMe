import { requireModelAccess } from "~/server/utils/auth";
import { buildModelState } from "~/server/utils/event-engine";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const { modelId } = getQuery(event);
  const validModelId = idSchema.parse(modelId);

  await requireModelAccess(event, validModelId);

  const state = await buildModelState(validModelId);

  return {
    nodes: state.nodes,
    edges: state.edges,
    lastEventId: state.lastEventId,
  };
});
