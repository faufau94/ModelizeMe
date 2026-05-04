import { estimateNodeSize, computeAssociationSize, computeLoopbackObstacle } from './useElk.js';
import { getBezierPath } from '@vue-flow/core';
import { getDistributedEdgeParams, getEdgeParams } from './useFloatingEdge.js';

/**
 * Compute the bezier midpoint for an edge - this is where CustomEdge.vue
 * actually renders the association table (edgePath[1], edgePath[2]).
 * Nodes must have fresh positions (post-layout).
 */
function computeEdgeMidpoint(srcNode, tgtNode, edge, allNodes, allEdges) {
  // Normalize nodes so getDistributedEdgeParams uses fresh positions
  const normalize = (n) => ({
    ...n,
    computedPosition: n.position,
    positionAbsolute: n.position,
  });
  const src = normalize(srcNode);
  const tgt = normalize(tgtNode);
  const normalizedNodes = allNodes.map(normalize);

  let params;
  if (normalizedNodes.length > 0 && allEdges.length > 0) {
    params = getDistributedEdgeParams(src, tgt, allEdges, normalizedNodes, edge.id);
  } else {
    params = getEdgeParams(src, tgt);
  }

  const [, labelX, labelY] = getBezierPath({
    sourceX: params.sx,
    sourceY: params.sy,
    targetX: params.tx,
    targetY: params.ty,
    sourcePosition: params.sourcePos,
    targetPosition: params.targetPos,
  });

  return { x: labelX, y: labelY };
}

/**
 * Build association obstacles from fresh node positions + edges.
 * Uses the actual bezier midpoint for accurate placement.
 */
function getAssociationObstacles(nodes, edges) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const obstacles = [];
  for (const edge of edges) {
    if (edge.source === edge.target) continue;
    if (!edge.data?.properties?.length && !edge.data?.hasNodeAssociation) continue;
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) continue;
    const size = computeAssociationSize(edge.data);
    const mid = computeEdgeMidpoint(src, tgt, edge, nodes, edges);
    obstacles.push({
      x: mid.x - size.width / 2,
      y: mid.y - size.height / 2,
      w: size.width,
      h: size.height,
    });
  }
  return obstacles;
}

/**
 * Build loopback arc obstacles from fresh node positions + edges.
 */
function getLoopbackObstacles(nodes, edges) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const obstacles = [];
  for (const edge of edges) {
    if (edge.source !== edge.target) continue;
    const node = nodeMap.get(edge.source);
    if (!node) continue;
    const w = node.dimensions?.width ?? estimateNodeSize(node).width;
    const h = node.dimensions?.height ?? estimateNodeSize(node).height;
    const side = edge.data?.loopbackSide || 'right';
    obstacles.push(computeLoopbackObstacle(node.position, w, h, side));
  }
  return obstacles;
}

/**
 * Build cardinality label obstacles from fresh node positions + edges.
 * Labels are ~60x30px, offset 40px from the handle.
 */
function getCardinalityObstacles(nodes, edges) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const obstacles = [];
  const offset = 40;
  const labelW = 60;
  const labelH = 30;

  for (const edge of edges) {
    if (edge.source === edge.target) continue;
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) continue;

    const normalize = (n) => ({
      ...n,
      computedPosition: n.position,
      positionAbsolute: n.position,
    });
    const normalizedNodes = nodes.map(normalize);
    let params;
    if (normalizedNodes.length > 0 && edges.length > 0) {
      params = getDistributedEdgeParams(normalize(src), normalize(tgt), edges, normalizedNodes, edge.id);
    } else {
      params = getEdgeParams(normalize(src), normalize(tgt));
    }

    // Source cardinality
    if (edge.data?.sourceCardinality) {
      let lx = params.sx;
      let ly = params.sy;
      if (params.sourcePos === 'left') lx -= offset;
      else if (params.sourcePos === 'right') lx += offset;
      if (params.sourcePos === 'top') ly -= offset;
      else if (params.sourcePos === 'bottom') ly += offset;
      obstacles.push({ x: lx - labelW / 2, y: ly - labelH / 2, w: labelW, h: labelH });
    }

    // Target cardinality
    if (edge.data?.targetCardinality) {
      let lx = params.tx;
      let ly = params.ty;
      if (params.targetPos === 'left') lx -= offset;
      else if (params.targetPos === 'right') lx += offset;
      if (params.targetPos === 'top') ly -= offset;
      else if (params.targetPos === 'bottom') ly += offset;
      obstacles.push({ x: lx - labelW / 2, y: ly - labelH / 2, w: labelW, h: labelH });
    }
  }
  return obstacles;
}

/**
 * Find a free position for a new node that doesn't overlap existing nodes.
 * Only moves the NEW node - never touches existing nodes.
 * Also considers association entity boxes rendered at edge midpoints.
 */
export function findFreePosition(candidate, size, otherNodes, flowInstance, margin = 40) {
  const obstacles = [];

  // Collect real nodes
  for (const node of otherNodes) {
    const w = node.dimensions?.width || estimateNodeSize(node).width;
    const h = node.dimensions?.height || estimateNodeSize(node).height;
    obstacles.push({ x: node.position.x, y: node.position.y, w, h });
  }

  // Collect virtual obstacles from edges
  if (flowInstance) {
    const edges = flowInstance.getEdges?.value || [];
    for (const edge of edges) {
      // Loopback arc obstacle
      if (edge.source === edge.target) {
        const node = flowInstance.findNode(edge.source);
        if (!node) continue;
        const pos = node.computedPosition || node.position;
        const nw = node.dimensions?.width ?? 320;
        const nh = node.dimensions?.height ?? 100;
        const side = edge.data?.loopbackSide || 'right';
        obstacles.push(computeLoopbackObstacle(pos, nw, nh, side));
        continue;
      }

      // Association table obstacle at edge midpoint
      if (!edge.data?.properties?.length && !edge.data?.hasNodeAssociation) continue;
      const src = flowInstance.findNode(edge.source);
      const tgt = flowInstance.findNode(edge.target);
      if (!src || !tgt) continue;
      const assocSize = computeAssociationSize(edge.data);
      obstacles.push({
        x: (src.position.x + tgt.position.x) / 2 - assocSize.width / 2,
        y: (src.position.y + tgt.position.y) / 2 - assocSize.height / 2,
        w: assocSize.width, h: assocSize.height,
      });
    }
  }

  const overlaps = (pos) => obstacles.some(o =>
    pos.x < o.x + o.w + margin &&
    pos.x + size.width + margin > o.x &&
    pos.y < o.y + o.h + margin &&
    pos.y + size.height + margin > o.y
  );

  if (!overlaps(candidate)) return candidate;

  // Spiral outward to find free spot - step scales with node size
  const step = Math.max(40, Math.min(size.width, size.height) * 0.5);
  for (let dist = step; dist < 1200; dist += step) {
    for (let angle = 0; angle < 360; angle += 20) {
      const pos = {
        x: candidate.x + dist * Math.cos(angle * Math.PI / 180),
        y: candidate.y + dist * Math.sin(angle * Math.PI / 180),
      };
      if (!overlaps(pos)) return pos;
    }
  }
  return { x: candidate.x + 400, y: candidate.y };
}

/**
 * Collision resolution: pushes overlapping nodes apart.
 * Uses fresh post-layout positions from the nodes/edges arrays (not flowInstance).
 * Includes virtual obstacles for associations, loopbacks, and cardinalities.
 *
 * @param {import('@vue-flow/core').Node[]} nodes - nodes with fresh positions
 * @param {import('@vue-flow/core').Edge[]} edges - edges for virtual obstacle computation
 * @param {{ maxIterations?: number, overlapThreshold?: number, margin?: number }} options
 * @returns {import('@vue-flow/core').Node[]}
 */
export function resolveCollisions(nodes, edges = [], { maxIterations = 50, overlapThreshold = 0.5, margin = 30 } = {}) {
  const boxes = nodes.map((node) => {
    const estimated = estimateNodeSize(node);
    const dimW = node.dimensions?.width;
    const dimH = node.dimensions?.height;
    // Use rendered dimensions only if they are meaningful (> 0)
    const w = (dimW && dimW > 0) ? dimW : estimated.width;
    const h = (dimH && dimH > 0) ? dimH : estimated.height;
    return {
      x: node.position.x - margin,
      y: node.position.y - margin,
      width: w + margin * 2,
      height: h + margin * 2,
      moved: false,
      isVirtual: false,
      node,
    };
  });

  // Helper to add virtual obstacle boxes
  const addVirtual = (obs) => {
    boxes.push({
      x: obs.x - margin,
      y: obs.y - margin,
      width: obs.w + margin * 2,
      height: obs.h + margin * 2,
      moved: false,
      isVirtual: true,
      node: null,
    });
  };

  // Add virtual boxes for association tables at bezier midpoints
  for (const obs of getAssociationObstacles(nodes, edges)) addVirtual(obs);

  // Add virtual boxes for loopback arcs
  for (const obs of getLoopbackObstacles(nodes, edges)) addVirtual(obs);

  // Add virtual boxes for cardinality labels
  for (const obs of getCardinalityObstacles(nodes, edges)) addVirtual(obs);

  for (let iter = 0; iter < maxIterations; iter++) {
    let totalDisplacement = 0;
    // Progressive damping: full force early, half force at end
    const damping = 1.0 - (iter / maxIterations) * 0.5;

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const A = boxes[i];
        const B = boxes[j];

        // Skip virtual-virtual pairs (they don't push each other)
        if (A.isVirtual && B.isVirtual) continue;

        const centerAX = A.x + A.width * 0.5;
        const centerAY = A.y + A.height * 0.5;
        const centerBX = B.x + B.width * 0.5;
        const centerBY = B.y + B.height * 0.5;

        const dx = centerAX - centerBX;
        const dy = centerAY - centerBY;

        const px = (A.width + B.width) * 0.5 - Math.abs(dx);
        const py = (A.height + B.height) * 0.5 - Math.abs(dy);

        if (px > overlapThreshold && py > overlapThreshold) {
          if (A.isVirtual) {
            // Only push B away (virtual obstacles are fixed)
            B.moved = true;
            if (px < py) {
              const push = (dx > 0 ? -1 : 1) * px * damping;
              B.x += push;
              totalDisplacement += Math.abs(push);
            } else {
              const push = (dy > 0 ? -1 : 1) * py * damping;
              B.y += push;
              totalDisplacement += Math.abs(push);
            }
          } else if (B.isVirtual) {
            // Only push A away
            A.moved = true;
            if (px < py) {
              const push = (dx > 0 ? 1 : -1) * px * damping;
              A.x += push;
              totalDisplacement += Math.abs(push);
            } else {
              const push = (dy > 0 ? 1 : -1) * py * damping;
              A.y += push;
              totalDisplacement += Math.abs(push);
            }
          } else {
            A.moved = B.moved = true;
            if (px < py) {
              const sx = dx > 0 ? 1 : -1;
              const moveAmount = (px / 2) * sx * damping;
              A.x += moveAmount;
              B.x -= moveAmount;
              totalDisplacement += Math.abs(moveAmount) * 2;
            } else {
              const sy = dy > 0 ? 1 : -1;
              const moveAmount = (py / 2) * sy * damping;
              A.y += moveAmount;
              B.y -= moveAmount;
              totalDisplacement += Math.abs(moveAmount) * 2;
            }
          }
        }
      }
    }

    // Converged or oscillating - stop early
    if (totalDisplacement < 1.0) break;
  }

  return boxes
    .filter((box) => !box.isVirtual)
    .map((box) => {
      if (box.moved) {
        return {
          ...box.node,
          position: {
            x: Math.round(box.x + margin),
            y: Math.round(box.y + margin),
          },
        };
      }
      return box.node;
    });
}
