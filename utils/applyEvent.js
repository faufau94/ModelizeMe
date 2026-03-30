/**
 * Apply a single event to a model state { nodes, edges }.
 * Pure function — no side effects. Shared between client stores.
 * Must stay in sync with server/utils/event-engine.ts applyEvent().
 */
export function applyEvent(state, event) {
  const nodes = [...state.nodes]
  const edges = [...state.edges]

  switch (event.type) {
    // ── Nodes ──

    case 'TABLE_ADDED':
    case 'TABLE_DUPLICATED': {
      const node = event.payload.node
      if (node) nodes.push(node)
      break
    }

    case 'TABLE_DELETED': {
      const nodeId = event.payload.nodeId
      const idx = nodes.findIndex((n) => n.id === nodeId)
      if (idx >= 0) nodes.splice(idx, 1)
      break
    }

    case 'TABLE_MOVED': {
      const { nodeId, x, y } = event.payload
      const node = nodes.find((n) => n.id === nodeId)
      if (node) node.position = { x, y }
      break
    }

    case 'TABLE_UPDATED': {
      const { nodeId, data } = event.payload
      const idx = nodes.findIndex((n) => n.id === nodeId)
      if (idx >= 0) {
        nodes[idx] = { ...nodes[idx], data: { ...nodes[idx].data, ...data } }
      }
      break
    }

    // ── Columns ──

    case 'COLUMN_ADDED': {
      const { nodeId, column } = event.payload
      const node = nodes.find((n) => n.id === nodeId)
      if (node?.data?.properties && column) {
        node.data.properties.push(column)
      }
      break
    }

    case 'COLUMN_UPDATED': {
      const { nodeId, columnId, data: colData } = event.payload
      const node = nodes.find((n) => n.id === nodeId)
      if (node?.data?.properties) {
        const col = node.data.properties.find((p) => p.id === columnId)
        if (col) Object.assign(col, colData)
      }
      break
    }

    case 'COLUMN_DELETED': {
      const { nodeId, columnId } = event.payload
      const node = nodes.find((n) => n.id === nodeId)
      if (node?.data?.properties) {
        node.data.properties = node.data.properties.filter((p) => p.id !== columnId)
      }
      break
    }

    case 'COLUMN_REORDERED': {
      const { nodeId, orderedIds } = event.payload
      const node = nodes.find((n) => n.id === nodeId)
      if (node?.data?.properties && orderedIds) {
        const byId = new Map(node.data.properties.map((p) => [p.id, p]))
        node.data.properties = orderedIds.map((id) => byId.get(id)).filter(Boolean)
      }
      break
    }

    // ── Edges ──

    case 'RELATION_ADDED': {
      const edge = event.payload.edge
      if (edge) edges.push(edge)
      break
    }

    case 'RELATION_DELETED': {
      const edgeId = event.payload.edgeId
      const idx = edges.findIndex((e) => e.id === edgeId)
      if (idx >= 0) edges.splice(idx, 1)
      break
    }

    case 'RELATION_UPDATED': {
      const { edgeId, data } = event.payload
      const idx = edges.findIndex((e) => e.id === edgeId)
      if (idx >= 0) {
        edges[idx] = { ...edges[idx], data: { ...edges[idx].data, ...data } }
      }
      break
    }

    // ── Layout / system ──

    case 'LAYOUT_APPLIED':
    case 'BATCH_POSITIONS': {
      const positions = event.payload.positions
      if (Array.isArray(positions)) {
        const posMap = new Map(positions.map((p) => [p.id, { x: p.x, y: p.y }]))
        for (const node of nodes) {
          const pos = posMap.get(node.id)
          if (pos) node.position = pos
        }
      }
      break
    }

    // ── Import ──

    case 'MODEL_IMPORTED': {
      if (Array.isArray(event.payload.nodes)) nodes.push(...event.payload.nodes)
      if (Array.isArray(event.payload.edges)) edges.push(...event.payload.edges)
      break
    }

    default:
      break
  }

  return { nodes, edges }
}
