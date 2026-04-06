import prisma from "~/lib/prisma";
import { requireModelAccess } from "~/server/utils/auth";
import { applyEvent, buildModelState, maybeCreateSnapshot } from "~/server/utils/event-engine";
import { z } from "zod";

const eventSchema = z.object({
  type: z.string().min(1).max(64),
  payload: z.record(z.unknown()),
  inverse: z.record(z.unknown()).nullable().optional(),
  undoable: z.boolean().optional().default(true),
});

const bodySchema = z.object({
  modelId: z.string().min(1),
  events: z.array(eventSchema).min(1).max(100),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { modelId, events } = bodySchema.parse(body);

  const { session } = await requireModelAccess(event, modelId);

  // For legacy models: create an initial snapshot from current Model.nodes/edges
  // BEFORE inserting any events, so buildModelState has a proper base state.
  const existingEventCount = await prisma.modelEvent.count({ where: { modelId } });
  if (existingEventCount === 0) {
    const model = await prisma.model.findUnique({
      where: { id: modelId },
      select: { nodes: true, edges: true },
    });
    if (model) {
      await prisma.modelSnapshot.create({
        data: {
          modelId,
          nodes: model.nodes || [],
          edges: model.edges || [],
          eventCursor: 0,
        },
      });
    }
  }

  // Insert all events in a single transaction
  const createdEvents = await prisma.$transaction(
    events.map((e) =>
      prisma.modelEvent.create({
        data: {
          modelId,
          type: e.type,
          payload: e.payload,
          inverse: e.inverse ?? undefined,
          userId: session.user.id,
          undoable: e.undoable,
        },
      })
    )
  );

  const eventIds = createdEvents.map((e) => e.id);
  const lastEventId = eventIds[eventIds.length - 1];

  // Double-write: rebuild state and update Model.nodes/edges for backward compatibility
  // This ensures read.get.ts, exports, MLD/MPD, galleries all keep working
  const state = await buildModelState(modelId);
  await prisma.model.update({
    where: { id: modelId },
    data: { nodes: state.nodes, edges: state.edges },
  });

  // Async snapshot creation (don't block response)
  maybeCreateSnapshot(modelId, lastEventId).catch(() => {});

  return { ok: true, eventIds };
});
