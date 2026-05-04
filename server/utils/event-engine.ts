import prisma from "~/lib/prisma";

// ─── TYPES ───

export interface ModelState {
  nodes: any[];
  edges: any[];
}

export interface EventPayload {
  type: string;
  payload: Record<string, any>;
  inverse?: Record<string, any> | null;
  undoable?: boolean;
}

// Snapshot threshold: create a snapshot every N events
const SNAPSHOT_INTERVAL = 50;

// ─── APPLY A SINGLE EVENT TO A STATE ───

export function applyEvent(state: ModelState, event: EventPayload): ModelState {
  const nodes = [...state.nodes];
  const edges = [...state.edges];

  switch (event.type) {
    // ── Nodes ──

    case "TABLE_ADDED": {
      const node = event.payload.node;
      if (node) nodes.push(node);
      break;
    }

    case "TABLE_DELETED": {
      const nodeId = event.payload.nodeId;
      const idx = nodes.findIndex((n) => n.id === nodeId);
      if (idx >= 0) nodes.splice(idx, 1);
      break;
    }

    case "TABLE_MOVED": {
      const { nodeId, x, y } = event.payload;
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        node.position = { x, y };
      }
      break;
    }

    case "TABLE_UPDATED": {
      const { nodeId, data } = event.payload;
      const idx = nodes.findIndex((n) => n.id === nodeId);
      if (idx >= 0) {
        nodes[idx] = { ...nodes[idx], data: { ...nodes[idx].data, ...data } };
      }
      break;
    }

    case "TABLE_DUPLICATED": {
      // Same as TABLE_ADDED - the duplicated node is a new full node
      const node = event.payload.node;
      if (node) nodes.push(node);
      break;
    }

    // ── Columns (sub-mutations within a node) ──

    case "COLUMN_ADDED": {
      const { nodeId, column } = event.payload;
      const node = nodes.find((n) => n.id === nodeId);
      if (node?.data?.properties && column) {
        node.data.properties.push(column);
      }
      break;
    }

    case "COLUMN_UPDATED": {
      const { nodeId, columnId, data: colData } = event.payload;
      const node = nodes.find((n) => n.id === nodeId);
      if (node?.data?.properties) {
        const col = node.data.properties.find((p: any) => p.id === columnId);
        if (col) Object.assign(col, colData);
      }
      break;
    }

    case "COLUMN_DELETED": {
      const { nodeId, columnId } = event.payload;
      const node = nodes.find((n) => n.id === nodeId);
      if (node?.data?.properties) {
        node.data.properties = node.data.properties.filter(
          (p: any) => p.id !== columnId
        );
      }
      break;
    }

    case "COLUMN_REORDERED": {
      const { nodeId, orderedIds } = event.payload;
      const node = nodes.find((n) => n.id === nodeId);
      if (node?.data?.properties && orderedIds) {
        const byId = new Map(
          node.data.properties.map((p: any) => [p.id, p])
        );
        node.data.properties = orderedIds
          .map((id: string) => byId.get(id))
          .filter(Boolean);
      }
      break;
    }

    // ── Edges (relations) ──

    case "RELATION_ADDED": {
      const edge = event.payload.edge;
      if (edge) edges.push(edge);
      break;
    }

    case "RELATION_DELETED": {
      const edgeId = event.payload.edgeId;
      const idx = edges.findIndex((e) => e.id === edgeId);
      if (idx >= 0) edges.splice(idx, 1);
      break;
    }

    case "RELATION_UPDATED": {
      const { edgeId, data } = event.payload;
      const idx = edges.findIndex((e) => e.id === edgeId);
      if (idx >= 0) {
        edges[idx] = { ...edges[idx], data: { ...edges[idx].data, ...data } };
      }
      break;
    }

    // ── Layout / system ──

    case "LAYOUT_APPLIED":
    case "BATCH_POSITIONS": {
      // payload.positions = [{ id, x, y }, ...]
      const positions = event.payload.positions;
      if (Array.isArray(positions)) {
        const posMap = new Map(
          positions.map((p: any) => [p.id, { x: p.x, y: p.y }])
        );
        for (const node of nodes) {
          const pos = posMap.get(node.id);
          if (pos) node.position = pos;
        }
      }
      break;
    }

    // ── Import ──

    case "MODEL_IMPORTED": {
      const importedNodes = event.payload.nodes;
      const importedEdges = event.payload.edges;
      if (Array.isArray(importedNodes)) nodes.push(...importedNodes);
      if (Array.isArray(importedEdges)) edges.push(...importedEdges);
      break;
    }

    default:
      // Unknown event type - ignore silently to be forward-compatible
      break;
  }

  return { nodes, edges };
}

// ─── BUILD FULL STATE FROM SNAPSHOT + EVENTS ───

export async function buildModelState(
  modelId: string
): Promise<ModelState & { lastEventId: number | null }> {
  // 1. Find latest snapshot
  const snapshot = await prisma.modelSnapshot.findFirst({
    where: { modelId },
    orderBy: { eventCursor: "desc" },
  });

  let state: ModelState;
  let cursor: number;

  if (snapshot) {
    state = {
      nodes: (snapshot.nodes as any[]) || [],
      edges: (snapshot.edges as any[]) || [],
    };
    cursor = snapshot.eventCursor;
  } else {
    // No snapshot: check if any events exist for this model
    const eventCount = await prisma.modelEvent.count({ where: { modelId } });

    if (eventCount > 0) {
      // Events exist: start from empty state and replay all events.
      // Do NOT use Model.nodes/edges as base - the double-write in events.post.ts
      // already updates them, so using them + replaying events = duplicates.
      state = { nodes: [], edges: [] };
      cursor = 0;
    } else {
      // No events at all: legacy model, use Model.nodes/edges as-is (migration compatibility)
      const model = await prisma.model.findUnique({
        where: { id: modelId },
        select: { nodes: true, edges: true },
      });

      state = {
        nodes: (model?.nodes as any[]) || [],
        edges: (model?.edges as any[]) || [],
      };
      cursor = 0;
    }
  }

  // 2. Replay events after the snapshot cursor
  const events = await prisma.modelEvent.findMany({
    where: {
      modelId,
      id: { gt: cursor },
    },
    orderBy: { id: "asc" },
  });

  for (const event of events) {
    state = applyEvent(state, {
      type: event.type,
      payload: event.payload as Record<string, any>,
    });
  }

  const lastEventId = events.length > 0 ? events[events.length - 1].id : (snapshot?.eventCursor ?? null);

  return { ...state, lastEventId };
}

// ─── CREATE SNAPSHOT IF THRESHOLD REACHED ───

export async function maybeCreateSnapshot(
  modelId: string,
  lastEventId: number
): Promise<void> {
  // Count events since last snapshot
  const lastSnapshot = await prisma.modelSnapshot.findFirst({
    where: { modelId },
    orderBy: { eventCursor: "desc" },
    select: { eventCursor: true },
  });

  const lastCursor = lastSnapshot?.eventCursor ?? 0;
  const eventsSinceSnapshot = lastEventId - lastCursor;

  if (eventsSinceSnapshot < SNAPSHOT_INTERVAL) return;

  // Build full state and create snapshot
  const state = await buildModelState(modelId);

  await prisma.modelSnapshot.create({
    data: {
      modelId,
      nodes: state.nodes,
      edges: state.edges,
      eventCursor: lastEventId,
    },
  });
}
