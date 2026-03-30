import { Position } from '@vue-flow/core';

// Function to get the center position of a node
function getNodeCenter(node) {
    const pos = node.computedPosition || node.positionAbsolute || node.position;
    if (!pos) return { x: 0, y: 0 };
    const w = node.dimensions?.width ?? node.width ?? 0;
    const h = node.dimensions?.height ?? node.height ?? 0;
    return {
        x: pos.x + w / 2,
        y: pos.y + h / 2,
    };
}

// Function to get handle coordinates based on position
function getHandleCoordsByPosition(node, handlePosition) {
    // Access the 'source' handles from handleBounds
    const handle = node.handleBounds?.source?.find(
        (h) => h.position === handlePosition,
    );

    if (!handle) {
        // Fallback: compute position from node center + half-dimension
        const pos = node.computedPosition || node.positionAbsolute || node.position || { x: 0, y: 0 };
        const w = node.dimensions?.width ?? node.width ?? 0;
        const h = node.dimensions?.height ?? node.height ?? 0;
        switch (handlePosition) {
            case Position.Left:   return [pos.x, pos.y + h / 2];
            case Position.Right:  return [pos.x + w, pos.y + h / 2];
            case Position.Top:    return [pos.x + w / 2, pos.y];
            case Position.Bottom: return [pos.x + w / 2, pos.y + h];
            default:              return [pos.x + w / 2, pos.y + h / 2];
        }
    }

    let offsetX = handle.width / 2;
    let offsetY = handle.height / 2;

    switch (handlePosition) {
        case Position.Left:
            offsetX = 0;
            break;
        case Position.Right:
            offsetX = handle.width;
            break;
        case Position.Top:
            offsetY = 0;
            break;
        case Position.Bottom:
            offsetY = handle.height;
            break;
    }

    const x = node.position.x + handle.x + offsetX;
    const y = node.position.y + handle.y + offsetY;

    return [x, y];
}

// Function to get parameters for positioning a node relative to another node
function getParams(nodeA, nodeB) {
    const centerA = getNodeCenter(nodeA);
    const centerB = getNodeCenter(nodeB);

    const horizontalDiff = Math.abs(centerA.x - centerB.x);
    const verticalDiff = Math.abs(centerA.y - centerB.y);

    let position;

    if (horizontalDiff > verticalDiff) {
        position = centerA.x > centerB.x ? Position.Left : Position.Right;
    } else {
        position = centerA.y > centerB.y ? Position.Top : Position.Bottom;
    }

    const [x, y] = getHandleCoordsByPosition(nodeA, position);
    return [x, y, position];
}

// Exported function to get edge parameters between source and target nodes
export function getEdgeParams(source, target) {
    const [sx, sy, sourcePos] = getParams(source, target);
    const [tx, ty, targetPos] = getParams(target, source);

    return {
        sx,
        sy,
        tx,
        ty,
        sourcePos,
        targetPos,
    };
}
