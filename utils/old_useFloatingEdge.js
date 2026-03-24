import { Position } from '@vue-flow/core';

/**
 * Computes the intersection point between the center of "intersectionNode" and "targetNode".
 * Vue Flow nodes expose their layout as `position`, `width`, and `height` props.
 */
function getNodeIntersection(intersectionNode, targetNode) {
    
  const w = intersectionNode.dimensions.width / 2;
  const h = intersectionNode.dimensions.height / 2;

  const x2 = intersectionNode.position.x + w;
  const y2 = intersectionNode.position.y + h;

  const x1 = targetNode.position.x + targetNode.dimensions.width / 2;
  const y1 = targetNode.position.y + targetNode.dimensions.height / 2;

  // Normalize direction vector against the bounding box
  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  

  return {
    x: w * (xx3 + yy3) + x2,
    y: h * (-xx3 + yy3) + y2,
  };
}

/**
 * Determines on which side (left, right, top, bottom) of the node the intersection lies.
 */
function getEdgePosition(node, intersectionPoint) {
  const nx = node.position.x;
  const ny = node.position.y;
  const { width, height } = node;
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  if (px <= nx + 1) return Position.Left;
  if (px >= nx + width - 1) return Position.Right;
  if (py <= ny + 1) return Position.Top;
  if (py >= ny + height - 1) return Position.Bottom;
  return Position.Top;
}

/**
 * Returns all parameters needed to render a custom edge between source and target.
 */
export function getEdgeParams(sourceNode, targetNode) {
  const sourcePt = getNodeIntersection(sourceNode, targetNode);
  const targetPt = getNodeIntersection(targetNode, sourceNode);

  const sourcePos = getEdgePosition(sourceNode, sourcePt);
  const targetPos = getEdgePosition(targetNode, targetPt);

  return {
    sx: sourcePt.x,
    sy: sourcePt.y,
    tx: targetPt.x,
    ty: targetPt.y,
    sourcePos,
    targetPos,
  };
}
