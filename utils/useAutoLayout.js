/**
 * Auto-layout utility for generated models (MCD, MLD, MPD).
 *
 * Uses a simple layered / force-directed approach:
 * 1. Build an adjacency list from edges.
 * 2. Assign nodes to layers via BFS (longest-path for DAG feeling).
 * 3. Position nodes in a grid with generous spacing, minimising edge crossings
 *    by ordering nodes within each layer based on median neighbour position.
 * 4. Recalculate edge handles (sourceHandle / targetHandle) based on relative positions.
 */

const NODE_WIDTH = 320;
const NODE_HEIGHT_BASE = 120; // minimum, will grow with properties
const SPACING_X = 180;
const SPACING_Y = 120;

/**
 * Estimate the rendered height of a node based on its property count.
 */
function estimateNodeHeight(node) {
  const propCount = node.data?.properties?.length ?? 0;
  const extra = (node.data?.hasTimestamps ? 2 : 0) + (node.data?.usesSoftDeletes ? 1 : 0);
  return NODE_HEIGHT_BASE + (propCount + extra) * 26;
}

/**
 * Build adjacency list (undirected) from edges.
 */
function buildAdjacency(nodes, edges) {
  const adj = new Map();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source).push(e.target);
      adj.get(e.target).push(e.source);
    }
  }
  return adj;
}

/**
 * Assign layers via BFS from root nodes (nodes with fewest connections first).
 * Returns Map<nodeId, layerIndex>.
 */
function assignLayers(nodes, adj) {
  const layers = new Map();
  const visited = new Set();

  // Sort nodes: prefer nodes with fewer connections as roots
  const sorted = [...nodes].sort((a, b) => {
    const da = adj.get(a.id)?.length ?? 0;
    const db = adj.get(b.id)?.length ?? 0;
    return da - db;
  });

  for (const root of sorted) {
    if (visited.has(root.id)) continue;
    const queue = [root.id];
    layers.set(root.id, 0);
    visited.add(root.id);

    while (queue.length > 0) {
      const current = queue.shift();
      const currentLayer = layers.get(current);
      for (const neighbour of (adj.get(current) ?? [])) {
        if (!visited.has(neighbour)) {
          visited.add(neighbour);
          layers.set(neighbour, currentLayer + 1);
          queue.push(neighbour);
        }
      }
    }
  }

  return layers;
}

/**
 * Determine the best sourceHandle / targetHandle pair based on relative node positions.
 * Handles: s1=Left, s2=Top, s3=Bottom, s4=Right
 */
function computeHandles(sourcePos, targetPos) {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal dominant
    return dx > 0
      ? { sourceHandle: 's4', targetHandle: 's1' } // source right → target left
      : { sourceHandle: 's1', targetHandle: 's4' }; // source left → target right
  } else {
    // Vertical dominant
    return dy > 0
      ? { sourceHandle: 's3', targetHandle: 's2' } // source bottom → target top
      : { sourceHandle: 's2', targetHandle: 's3' }; // source top → target bottom
  }
}

/**
 * Main layout function.
 * @param {Array} nodes - Array of node objects (must have id, data)
 * @param {Array} edges - Array of edge objects (must have source, target)
 * @returns {{ nodes: Array, edges: Array }} - Nodes with updated positions, edges with updated handles
 */
export function autoLayout(nodes, edges) {
  if (!nodes || nodes.length === 0) return { nodes: [], edges: [] };

  const adj = buildAdjacency(nodes, edges);
  const layerMap = assignLayers(nodes, adj);

  // Group nodes by layer
  const layerGroups = new Map();
  for (const node of nodes) {
    const layer = layerMap.get(node.id) ?? 0;
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer).push(node);
  }

  // Sort layers
  const sortedLayers = [...layerGroups.keys()].sort((a, b) => a - b);

  // For each layer, order nodes by median position of their neighbours in adjacent layers
  // (simple heuristic to reduce crossings)
  for (let pass = 0; pass < 3; pass++) {
    for (const layerIdx of sortedLayers) {
      const layerNodes = layerGroups.get(layerIdx);
      layerNodes.sort((a, b) => {
        const medA = medianNeighbourIndex(a.id, adj, layerMap, layerGroups);
        const medB = medianNeighbourIndex(b.id, adj, layerMap, layerGroups);
        return medA - medB;
      });
    }
  }

  // Position nodes
  const nodePositions = new Map();
  let currentX = 0;

  for (const layerIdx of sortedLayers) {
    const layerNodes = layerGroups.get(layerIdx);
    let currentY = 0;
    let maxWidth = 0;

    for (const node of layerNodes) {
      const h = estimateNodeHeight(node);
      node.position = { x: currentX, y: currentY };
      nodePositions.set(node.id, { ...node.position, width: NODE_WIDTH, height: h });
      currentY += h + SPACING_Y;
      maxWidth = Math.max(maxWidth, NODE_WIDTH);
    }

    currentX += maxWidth + SPACING_X;
  }

  // Update edges with proper handles
  const layoutedEdges = edges.map((edge) => {
    const sPos = nodePositions.get(edge.source);
    const tPos = nodePositions.get(edge.target);
    if (!sPos || !tPos) return edge;

    const sCenterX = sPos.x + sPos.width / 2;
    const sCenterY = sPos.y + sPos.height / 2;
    const tCenterX = tPos.x + tPos.width / 2;
    const tCenterY = tPos.y + tPos.height / 2;

    const { sourceHandle, targetHandle } = computeHandles(
      { x: sCenterX, y: sCenterY },
      { x: tCenterX, y: tCenterY }
    );

    return {
      ...edge,
      sourceHandle,
      targetHandle,
    };
  });

  return { nodes, edges: layoutedEdges };
}

/**
 * Compute the median index of a node's neighbours in their respective layers.
 */
function medianNeighbourIndex(nodeId, adj, layerMap, layerGroups) {
  const neighbours = adj.get(nodeId) ?? [];
  const indices = [];
  for (const nId of neighbours) {
    const nLayer = layerMap.get(nId);
    const layerNodes = layerGroups.get(nLayer);
    if (layerNodes) {
      const idx = layerNodes.findIndex((n) => n.id === nId);
      if (idx >= 0) indices.push(idx);
    }
  }
  if (indices.length === 0) return 0;
  indices.sort((a, b) => a - b);
  return indices[Math.floor(indices.length / 2)];
}
