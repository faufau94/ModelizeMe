/**
 * Find a free position for a new node that doesn't overlap existing nodes.
 * Only moves the NEW node - never touches existing nodes.
 * Also considers association entity boxes rendered at edge midpoints.
 */
export function findFreePosition(candidate, size, otherNodes, flowInstance, margin = 40) {
  const obstacles = [];

  // Collect real nodes
  for (const node of otherNodes) {
    const w = node.dimensions?.width || fallbackNodeSize(node).width;
    const h = node.dimensions?.height || fallbackNodeSize(node).height;
    obstacles.push({ x: node.position.x, y: node.position.y, w, h });
  }

  // Collect virtual association nodes from edges + loopback arc zones
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
        const bulgeW = Math.max(110, nw * 0.55);
        const bulgeH = Math.max(110, nh * 0.75);
        switch (side) {
          case 'right':
            obstacles.push({ x: pos.x + nw, y: pos.y, w: bulgeW, h: nh });
            break;
          case 'left':
            obstacles.push({ x: pos.x - bulgeW, y: pos.y, w: bulgeW, h: nh });
            break;
          case 'top':
            obstacles.push({ x: pos.x, y: pos.y - bulgeH, w: nw, h: bulgeH });
            break;
          case 'bottom':
            obstacles.push({ x: pos.x, y: pos.y + nh, w: nw, h: bulgeH });
            break;
        }
        continue;
      }

      // Association table obstacle at edge midpoint
      if (!edge.data?.properties?.length && !edge.data?.hasNodeAssociation) continue;
      const src = flowInstance.findNode(edge.source);
      const tgt = flowInstance.findNode(edge.target);
      if (!src || !tgt) continue;
      const propCount = edge.data?.properties?.length || 0;
      const hasTs = edge.data?.hasTimestamps ? 2 : 0;
      const hasSd = edge.data?.usesSoftDeletes ? 1 : 0;
      const assocW = 250;
      const assocH = Math.max(100, 50 + (propCount + hasTs + hasSd) * 28);
      obstacles.push({
        x: (src.position.x + tgt.position.x) / 2 - assocW / 2,
        y: (src.position.y + tgt.position.y) / 2 - assocH / 2,
        w: assocW, h: assocH,
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

  // Spiral outward to find free spot — step scales with node size
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
 * Collision resolution algorithm adapted from React Flow examples.
 * Iteratively pushes overlapping nodes apart along the smallest overlap axis.
 */

function fallbackNodeSize(node) {
  const propertyCount = Array.isArray(node?.data?.properties) ? node.data.properties.length : 0;
  const hasTimestamps = node?.data?.hasTimestamps ? 2 : 0;
  const hasSoftDeletes = node?.data?.usesSoftDeletes ? 1 : 0;
  const rowCount = propertyCount + hasTimestamps + hasSoftDeletes;
  const isAssociation = node?.type === 'customEntityAssociation';
  const isTernary = node?.type === 'ternaryEntity';

  if (isAssociation || isTernary) {
    const width = 250;
    const baseHeight = isTernary ? 110 : 70;
    const rowHeight = 28;
    return {
      width,
      height: Math.max(baseHeight + rowCount * rowHeight, 120),
    };
  }

  return {
    width: 340,
    height: Math.max(80 + rowCount * 32, 160),
  };
}

/**
 * Build virtual obstacle boxes for association tables rendered at edge midpoints.
 * These are not real nodes but occupy space visually.
 */
function getAssociationObstacles(flowInstance) {
  const obstacles = [];
  if (!flowInstance) return obstacles;
  const edges = flowInstance.getEdges?.value || [];
  for (const edge of edges) {
    if (!edge.data?.properties?.length && !edge.data?.hasNodeAssociation) continue;
    // Skip loopback edges (association rendered on arc, not midpoint)
    if (edge.source === edge.target) continue;
    const src = flowInstance.findNode(edge.source);
    const tgt = flowInstance.findNode(edge.target);
    if (!src || !tgt) continue;
    const propCount = edge.data?.properties?.length || 0;
    const hasTs = edge.data?.hasTimestamps ? 2 : 0;
    const hasSd = edge.data?.usesSoftDeletes ? 1 : 0;
    const assocW = 250;
    const assocH = Math.max(100, 50 + (propCount + hasTs + hasSd) * 28);
    obstacles.push({
      x: (src.position.x + tgt.position.x) / 2 - assocW / 2,
      y: (src.position.y + tgt.position.y) / 2 - assocH / 2,
      w: assocW,
      h: assocH,
    });
  }
  return obstacles;
}

/**
 * Build virtual obstacle boxes for loopback (reflexive) edge arcs.
 * The arc extends outward from one side of the node and needs reserved space.
 */
function getLoopbackObstacles(flowInstance) {
  const obstacles = [];
  if (!flowInstance) return obstacles;
  const edges = flowInstance.getEdges?.value || [];
  for (const edge of edges) {
    if (edge.source !== edge.target) continue;
    const node = flowInstance.findNode(edge.source);
    if (!node) continue;
    const pos = node.computedPosition || node.position;
    const w = node.dimensions?.width ?? 320;
    const h = node.dimensions?.height ?? 100;
    const side = edge.data?.loopbackSide || 'right';
    const bulgeW = Math.max(80, w * 0.5);
    const bulgeH = Math.max(80, h * 0.65);
    switch (side) {
      case 'right':
        obstacles.push({ x: pos.x + w, y: pos.y, w: bulgeW, h });
        break;
      case 'left':
        obstacles.push({ x: pos.x - bulgeW, y: pos.y, w: bulgeW, h });
        break;
      case 'top':
        obstacles.push({ x: pos.x, y: pos.y - bulgeH, w, h: bulgeH });
        break;
      case 'bottom':
        obstacles.push({ x: pos.x, y: pos.y + h, w, h: bulgeH });
        break;
    }
  }
  return obstacles;
}

/**
 * @param {import('@vue-flow/core').Node[]} nodes
 * @param {{ maxIterations?: number, overlapThreshold?: number, margin?: number, flowInstance?: any }} options
 * @returns {import('@vue-flow/core').Node[]}
 */
export function resolveCollisions(nodes, { maxIterations = 80, overlapThreshold = 0.5, margin = 30, flowInstance = null } = {}) {
  const boxes = nodes.map((node) => {
    const estimated = fallbackNodeSize(node);
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

  // Add virtual boxes for association tables at edge midpoints
  const assocObstacles = getAssociationObstacles(flowInstance);
  for (const obs of assocObstacles) {
    boxes.push({
      x: obs.x - margin,
      y: obs.y - margin,
      width: obs.w + margin * 2,
      height: obs.h + margin * 2,
      moved: false,
      isVirtual: true,
      node: null,
    });
  }

  // Add virtual boxes for loopback arcs
  const loopObstacles = getLoopbackObstacles(flowInstance);
  for (const obs of loopObstacles) {
    boxes.push({
      x: obs.x - margin,
      y: obs.y - margin,
      width: obs.w + margin * 2,
      height: obs.h + margin * 2,
      moved: false,
      isVirtual: true,
      node: null,
    });
  }

  for (let iter = 0; iter < maxIterations; iter++) {
    let moved = false;

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
          moved = true;
          if (A.isVirtual) {
            // Only push B away (virtual obstacles are fixed)
            B.moved = true;
            if (px < py) {
              B.x -= (dx > 0 ? 1 : -1) * px;
            } else {
              B.y -= (dy > 0 ? 1 : -1) * py;
            }
          } else if (B.isVirtual) {
            // Only push A away
            A.moved = true;
            if (px < py) {
              A.x += (dx > 0 ? 1 : -1) * px;
            } else {
              A.y += (dy > 0 ? 1 : -1) * py;
            }
          } else {
            A.moved = B.moved = true;
            if (px < py) {
              const sx = dx > 0 ? 1 : -1;
              const moveAmount = (px / 2) * sx;
              A.x += moveAmount;
              B.x -= moveAmount;
            } else {
              const sy = dy > 0 ? 1 : -1;
              const moveAmount = (py / 2) * sy;
              A.y += moveAmount;
              B.y -= moveAmount;
            }
          }
        }
      }
    }

    if (!moved) break;
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
