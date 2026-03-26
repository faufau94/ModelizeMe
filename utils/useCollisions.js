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
export function resolveCollisions(nodes, { maxIterations = 50, overlapThreshold = 0.5, margin = 20 } = {}) {
  const boxes = nodes.map((node) => {
    const estimated = fallbackNodeSize(node);
    const w = node.dimensions?.width ?? estimated.width;
    const h = node.dimensions?.height ?? estimated.height;
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
