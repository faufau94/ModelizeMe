/**
 * Find a free position for a new node that doesn't overlap existing nodes.
 * Only moves the NEW node — never touches existing nodes.
 * Also considers association entity boxes rendered at edge midpoints.
 */
export function findFreePosition(candidate, size, otherNodes, flowInstance, margin = 30) {
  const obstacles = [];

  // Collect real nodes
  for (const node of otherNodes) {
    const w = node.dimensions?.width || fallbackNodeSize(node).width;
    const h = node.dimensions?.height || fallbackNodeSize(node).height;
    obstacles.push({ x: node.position.x, y: node.position.y, w, h });
  }

  // Collect virtual association nodes from edges
  if (flowInstance) {
    const edges = flowInstance.getEdges?.value || [];
    for (const edge of edges) {
      if (!edge.data?.properties?.length && !edge.data?.hasNodeAssociation) continue;
      const src = flowInstance.findNode(edge.source);
      const tgt = flowInstance.findNode(edge.target);
      if (!src || !tgt) continue;
      // Size matches MyCustomEntityAssociation: min-width 160, max-width 240, rows ~28px each
      const propCount = edge.data?.properties?.length || 0;
      const hasTs = edge.data?.hasTimestamps ? 2 : 0;
      const hasSd = edge.data?.usesSoftDeletes ? 1 : 0;
      const assocW = 240;
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

  // Spiral outward to find free spot
  for (let dist = 60; dist < 1200; dist += 60) {
    for (let angle = 0; angle < 360; angle += 30) {
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
  const width = isAssociation ? 280 : 340;
  const baseHeight = isAssociation ? 70 : 80;
  const rowHeight = isAssociation ? 28 : 32;
  return {
    width,
    height: Math.max(baseHeight + rowCount * rowHeight, isAssociation ? 120 : 160),
  };
}

/**
 * @param {import('@vue-flow/core').Node[]} nodes
 * @param {{ maxIterations?: number, overlapThreshold?: number, margin?: number }} options
 * @returns {import('@vue-flow/core').Node[]}
 */
export function resolveCollisions(nodes, { maxIterations = 80, overlapThreshold = 0.5, margin = 20 } = {}) {
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
      node,
    };
  });

  for (let iter = 0; iter < maxIterations; iter++) {
    let moved = false;

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const A = boxes[i];
        const B = boxes[j];

        const centerAX = A.x + A.width * 0.5;
        const centerAY = A.y + A.height * 0.5;
        const centerBX = B.x + B.width * 0.5;
        const centerBY = B.y + B.height * 0.5;

        const dx = centerAX - centerBX;
        const dy = centerAY - centerBY;

        const px = (A.width + B.width) * 0.5 - Math.abs(dx);
        const py = (A.height + B.height) * 0.5 - Math.abs(dy);

        if (px > overlapThreshold && py > overlapThreshold) {
          A.moved = B.moved = moved = true;
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

    if (!moved) break;
  }

  return boxes.map((box) => {
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
