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

// Determine which side of nodeA faces nodeB
function getSide(nodeA, nodeB) {
    const centerA = getNodeCenter(nodeA);
    const centerB = getNodeCenter(nodeB);

    const horizontalDiff = Math.abs(centerA.x - centerB.x);
    const verticalDiff = Math.abs(centerA.y - centerB.y);

    if (horizontalDiff > verticalDiff) {
        return centerA.x > centerB.x ? Position.Left : Position.Right;
    } else {
        return centerA.y > centerB.y ? Position.Top : Position.Bottom;
    }
}

// Compute a distributed connection point along a node's side.
// index: 0-based position among edges on this side, count: total edges on this side.
// Edges are spaced evenly with padding from corners.
function getDistributedCoords(node, side, index, count) {
    const pos = node.computedPosition || node.positionAbsolute || node.position || { x: 0, y: 0 };
    const w = node.dimensions?.width ?? node.width ?? 320;
    const h = node.dimensions?.height ?? node.height ?? 100;

    // Padding from corners (% of side length)
    const padding = 0.15;

    if (count <= 1) {
        // Single edge - use the center of the side (original behavior)
        switch (side) {
            case Position.Left:   return [pos.x, pos.y + h / 2];
            case Position.Right:  return [pos.x + w, pos.y + h / 2];
            case Position.Top:    return [pos.x + w / 2, pos.y];
            case Position.Bottom: return [pos.x + w / 2, pos.y + h];
            default:              return [pos.x + w / 2, pos.y + h / 2];
        }
    }

    // t goes from padding to (1-padding), evenly spaced
    const t = padding + ((1 - 2 * padding) * index) / (count - 1);

    switch (side) {
        case Position.Left:   return [pos.x, pos.y + h * t];
        case Position.Right:  return [pos.x + w, pos.y + h * t];
        case Position.Top:    return [pos.x + w * t, pos.y];
        case Position.Bottom: return [pos.x + w * t, pos.y + h];
        default:              return [pos.x + w / 2, pos.y + h / 2];
    }
}

// Function to get parameters for positioning a node relative to another node
function getParams(nodeA, nodeB) {
    const position = getSide(nodeA, nodeB);
    const [x, y] = getHandleCoordsByPosition(nodeA, position);
    return [x, y, position];
}

// Exported function to get edge parameters between source and target nodes (no distribution)
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

// Collect all non-loopback edges connected to a node, grouped by which side they connect on.
// Returns a Map<Position, edgeId[]> sorted consistently by the other node's center coordinate.
function buildSideMap(nodeId, allEdges, allNodes) {
    const sideMap = new Map(); // Position → [{ edgeId, otherNodeCenter }]

    for (const edge of allEdges) {
        // Skip loopback edges
        if (edge.source === edge.target) continue;

        let thisNodeId, otherNodeId;
        if (edge.source === nodeId) {
            thisNodeId = edge.source;
            otherNodeId = edge.target;
        } else if (edge.target === nodeId) {
            thisNodeId = edge.target;
            otherNodeId = edge.source;
        } else {
            continue;
        }

        const thisNode = allNodes.find(n => n.id === thisNodeId);
        const otherNode = allNodes.find(n => n.id === otherNodeId);
        if (!thisNode || !otherNode) continue;

        const side = getSide(thisNode, otherNode);
        if (!sideMap.has(side)) sideMap.set(side, []);

        const otherCenter = getNodeCenter(otherNode);
        sideMap.get(side).push({ edgeId: edge.id, otherCenter });
    }

    // Sort edges on each side for consistent ordering:
    // Left/Right sides → sort by Y of the other node
    // Top/Bottom sides → sort by X of the other node
    for (const [side, entries] of sideMap) {
        if (side === Position.Left || side === Position.Right) {
            entries.sort((a, b) => a.otherCenter.y - b.otherCenter.y);
        } else {
            entries.sort((a, b) => a.otherCenter.x - b.otherCenter.x);
        }
    }

    return sideMap;
}

// Distributed edge params: spreads connection points when multiple edges share a side.
// allEdges & allNodes come from the VueFlow instance.
export function getDistributedEdgeParams(source, target, allEdges, allNodes, edgeId) {
    const sourcePos = getSide(source, target);
    const targetPos = getSide(target, source);

    // Build side maps for source and target nodes
    const sourceSideMap = buildSideMap(source.id, allEdges, allNodes);
    const targetSideMap = buildSideMap(target.id, allEdges, allNodes);

    // Find index and count for this edge on the source side
    const sourceEdges = sourceSideMap.get(sourcePos) || [{ edgeId }];
    const sourceIndex = sourceEdges.findIndex(e => e.edgeId === edgeId);
    const si = sourceIndex >= 0 ? sourceIndex : 0;

    // Find index and count for this edge on the target side
    const targetEdges = targetSideMap.get(targetPos) || [{ edgeId }];
    const targetIndex = targetEdges.findIndex(e => e.edgeId === edgeId);
    const ti = targetIndex >= 0 ? targetIndex : 0;

    const [sx, sy] = getDistributedCoords(source, sourcePos, si, sourceEdges.length);
    const [tx, ty] = getDistributedCoords(target, targetPos, ti, targetEdges.length);

    return {
        sx,
        sy,
        tx,
        ty,
        sourcePos,
        targetPos,
    };
}
