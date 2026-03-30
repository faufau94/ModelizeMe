// DEPRECATED — replaced by POST /api/models/events (event sourcing)
// Kept for backward compatibility during migration. Will be removed after Phase 5.
import prisma from "~/lib/prisma";
import { requireModelAccess } from "~/server/utils/auth";
import { z } from "zod";

const syncSchema = z.object({
  id: z.string().min(1),
  nodes: z.array(z.record(z.unknown())).max(500, "Max 500 nœuds"),
  edges: z.array(z.record(z.unknown())).max(1000, "Max 1000 arêtes"),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, nodes, edges } = syncSchema.parse(body);

  await requireModelAccess(event, id);

  return await prisma.model.update({
    where: { id },
    data: { nodes, edges },
  });
});
