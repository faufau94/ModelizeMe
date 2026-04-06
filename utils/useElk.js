import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

/**
 * Compute the size of an association table rendered on an edge.
 * Single source of truth — used by useElk (phantom nodes) and useCollisions (obstacles).
 */
const computeAssociationSize = (edgeData) => {
    const propCount = edgeData?.properties?.length || 0;
    const hasTs = edgeData?.hasTimestamps ? 2 : 0;
    const hasSd = edgeData?.usesSoftDeletes ? 1 : 0;
    const totalRows = propCount + hasTs + hasSd;
    return {
        width: 250,
        height: Math.max(100, 48 + totalRows * 28),
    };
};

/**
 * Compute the bounding box of a loopback arc obstacle.
 * Matches the actual rendering in CustomEdge.vue exactly.
 */
const computeLoopbackObstacle = (nodePos, w, h, side = 'right') => {
    const bulgeHoriz = Math.max(100, w * 0.5);
    const bulgeVert = Math.max(100, h * 0.7);
    switch (side) {
        case 'right':
            return { x: nodePos.x + w, y: nodePos.y, w: bulgeHoriz, h };
        case 'left':
            return { x: nodePos.x - bulgeHoriz, y: nodePos.y, w: bulgeHoriz, h };
        case 'top':
            return { x: nodePos.x, y: nodePos.y - bulgeVert, w, h: bulgeVert };
        case 'bottom':
            return { x: nodePos.x, y: nodePos.y + h, w, h: bulgeVert };
        default:
            return { x: nodePos.x + w, y: nodePos.y, w: bulgeHoriz, h };
    }
};

/**
 * Estimate the rendered size of a node based on its actual data.
 * Calculates from the real property count so spacing is always correct.
 */
const estimateNodeSize = (node) => {
    // If Vue Flow has already rendered the node, use its real dimensions + safety margin
    if (node?.dimensions?.width && node?.dimensions?.height) {
        return {
            width: node.dimensions.width + 20,
            height: node.dimensions.height + 20,
        };
    }

    // Otherwise, estimate from data
    const propertyCount = Array.isArray(node?.data?.properties) ? node.data.properties.length : 0;
    const hasTimestamps = node?.data?.hasTimestamps ? 2 : 0;
    const hasSoftDeletes = node?.data?.usesSoftDeletes ? 1 : 0;
    const rowCount = propertyCount + hasTimestamps + hasSoftDeletes;
    const isAssociation = node?.type === 'customEntityAssociation';
    const isTernary = node?.type === 'ternaryEntity';

    if (isAssociation || isTernary) {
        const width = 250;
        const baseHeight = isTernary ? 110 : 70;  // Ternary: extra space for CIF badge
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
};

/**
 * Compute dynamic ELK options from the actual nodes.
 * Spacing is derived from the tallest/widest node so nothing overlaps,
 * including the association entity boxes that sit at edge midpoints.
 */
const computeElkOptions = (nodes, edges, direction = 'RIGHT') => {
    let maxW = 0;
    let maxH = 0;
    for (const node of (nodes || [])) {
        const { width, height } = estimateNodeSize(node);
        if (width > maxW) maxW = width;
        if (height > maxH) maxH = height;
    }

    // Count loopback edges — they need extra space on the side of their parent node
    let loopbackCount = 0;
    for (const edge of (edges || [])) {
        if (edge.source === edge.target) loopbackCount++;
    }

    // Extra spacing when loopbacks are present (arcs extend outward from nodes)
    const loopbackExtra = loopbackCount > 0 ? 100 : 0;

    return {
        'elk.algorithm': 'layered',
        'elk.direction': direction,
        'elk.layered.spacing.nodeNodeBetweenLayers': String(Math.max(300, Math.round(maxW * 0.85)) + loopbackExtra),
        'elk.spacing.nodeNode': String(Math.max(150, Math.round(maxH * 0.55))),
        'elk.spacing.edgeEdge': '50',
        'elk.spacing.edgeNode': '100',
        'elk.spacing.componentComponent': '200',
        'elk.edgeRouting': 'SPLINES',
        'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
        'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        'elk.separateConnectedComponents': 'true',
        'elk.layered.compaction.postCompaction.strategy': 'EDGE_LENGTH',
        'elk.padding.top': '100',
        'elk.padding.left': '100',
        'elk.padding.bottom': '100',
        'elk.padding.right': '100',
    };
};

/**
 * Handle-pair choices ordered by priority.
 * s1=Left, s2=Top, s3=Bottom, s4=Right
 */
const HANDLE_PAIRS = [
    { sourceHandle: 's4', targetHandle: 's1' }, // right → left (horizontal)
    { sourceHandle: 's3', targetHandle: 's2' }, // bottom → top (vertical)
    { sourceHandle: 's1', targetHandle: 's4' }, // left → right
    { sourceHandle: 's2', targetHandle: 's3' }, // top → bottom
];

/**
 * Determine best sourceHandle / targetHandle pair based on relative node positions.
 */
const determineHandles = (sourceNode, targetNode) => {
    const dx = targetNode.position.x - sourceNode.position.x;
    const dy = targetNode.position.y - sourceNode.position.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0
            ? { sourceHandle: 's4', targetHandle: 's1' }
            : { sourceHandle: 's1', targetHandle: 's4' };
    } else {
        return dy > 0
            ? { sourceHandle: 's3', targetHandle: 's2' }
            : { sourceHandle: 's2', targetHandle: 's3' };
    }
};

/**
 * Lay out nodes + edges using ELK.
 * Options are computed dynamically from the nodes when not explicitly provided.
 * Multiple edges between the same node pair get different handle combos
 * so their association entities don't overlap.
 */
const getLayoutedElements = (nodes, edges, options) => {
    const opts = options || computeElkOptions(nodes, edges);

    // Separate loopback edges (source === target) — ELK layered doesn't handle self-loops
    const normalEdges = [];
    const loopbackEdges = [];
    for (const edge of edges) {
        if (edge.source === edge.target) {
            loopbackEdges.push(edge);
        } else {
            normalEdges.push(edge);
        }
    }

    // Separate ternary entity nodes — they will be positioned post-layout
    // at the barycenter of their connected entities, not by ELK's layered algo
    const ternaryNodeIds = new Set();
    const regularNodes = [];
    for (const node of nodes) {
        if (node.type === 'ternaryEntity') {
            ternaryNodeIds.add(node.id);
        } else {
            regularNodes.push(node);
        }
    }

    // Separate ternary edges from normal edges
    const ternaryEdgesByNode = new Map(); // ternaryNodeId → [edge, ...]
    const nonTernaryEdges = [];
    for (const edge of normalEdges) {
        if (ternaryNodeIds.has(edge.target)) {
            const list = ternaryEdgesByNode.get(edge.target) || [];
            list.push(edge);
            ternaryEdgesByNode.set(edge.target, list);
        } else if (ternaryNodeIds.has(edge.source)) {
            const list = ternaryEdgesByNode.get(edge.source) || [];
            list.push(edge);
            ternaryEdgesByNode.set(edge.source, list);
        } else {
            nonTernaryEdges.push(edge);
        }
    }

    // Inject phantom nodes for association entities so ELK reserves space for them.
    // An edge with data.hasNodeAssociation or non-empty data.properties gets a phantom.
    const phantomNodes = [];
    const elkEdges = [];

    for (const edge of nonTernaryEdges) {
        const hasAssoc = edge.data?.hasNodeAssociation || (edge.data?.properties?.length > 0);
        if (hasAssoc) {
            const phantomId = `phantom_${edge.id}`;
            const phantomSize = computeAssociationSize(edge.data);
            phantomNodes.push({ id: phantomId, width: phantomSize.width, height: phantomSize.height });
            // Split into two edges through the phantom node
            elkEdges.push({ id: `${edge.id}_a`, sources: [edge.source], targets: [phantomId] });
            elkEdges.push({ id: `${edge.id}_b`, sources: [phantomId], targets: [edge.target] });
        } else {
            elkEdges.push({ id: edge.id, sources: [edge.source], targets: [edge.target] });
        }
    }

    // Build a clean graph for ELK - only pass id, width, height.
    // Never pass reactive Vue Flow objects to ELK. Ternary nodes excluded.
    const graph = {
        id: 'root',
        layoutOptions: opts,
        children: [
            ...regularNodes.map((node) => {
                const size = estimateNodeSize(node);
                return { id: node.id, width: size.width, height: size.height };
            }),
            ...phantomNodes,
        ],
        edges: elkEdges,
    };

    return elk
        .layout(graph)
        .then((layoutedGraph) => {
            // Build a position map from ELK results (skip phantom nodes for output)
            const positionMap = new Map();
            const sizeMap = new Map();
            for (const child of layoutedGraph.children) {
                positionMap.set(child.id, { x: child.x, y: child.y });
                sizeMap.set(child.id, { width: child.width, height: child.height });
            }

            // Apply new positions to regular nodes (preserving all Vue Flow properties)
            // ELK guarantees no overlap between its children — no post-processing needed.
            const layoutedRegularNodes = regularNodes.map((node) => {
                const pos = positionMap.get(node.id);
                return { ...node, position: pos || node.position };
            });

            // Position ternary nodes at the barycenter of their connected entities,
            // then nudge away from any overlapping node or virtual obstacle via spiral search
            const allPositionedNodes = [...layoutedRegularNodes];

            // Build virtual obstacles for associations and loopbacks
            // so ternary nodes don't overlap them either
            const virtualObstacles = [];
            const nodeMap = new Map(layoutedRegularNodes.map(n => [n.id, n]));
            for (const edge of nonTernaryEdges) {
                if (edge.source === edge.target) continue;
                if (!edge.data?.properties?.length && !edge.data?.hasNodeAssociation) continue;
                const src = nodeMap.get(edge.source);
                const tgt = nodeMap.get(edge.target);
                if (!src || !tgt) continue;
                const assocSize = computeAssociationSize(edge.data);
                // Approximate midpoint (exact bezier not needed here — ELK handles main spacing)
                const midX = (src.position.x + tgt.position.x) / 2;
                const midY = (src.position.y + tgt.position.y) / 2;
                virtualObstacles.push({
                    x: midX - assocSize.width / 2,
                    y: midY - assocSize.height / 2,
                    w: assocSize.width,
                    h: assocSize.height,
                });
            }
            for (const edge of loopbackEdges) {
                const node = nodeMap.get(edge.source);
                if (!node) continue;
                const w = node.dimensions?.width ?? estimateNodeSize(node).width;
                const h = node.dimensions?.height ?? estimateNodeSize(node).height;
                const side = edge.data?.loopbackSide || 'right';
                virtualObstacles.push(computeLoopbackObstacle(node.position, w, h, side));
            }

            for (const node of nodes) {
                if (!ternaryNodeIds.has(node.id)) continue;

                const connectedEdges = ternaryEdgesByNode.get(node.id) || [];
                const connectedPositions = [];
                for (const edge of connectedEdges) {
                    const otherId = edge.source === node.id ? edge.target : edge.source;
                    const pos = positionMap.get(otherId);
                    if (pos) connectedPositions.push(pos);
                }

                let barycenter;
                if (connectedPositions.length > 0) {
                    barycenter = {
                        x: connectedPositions.reduce((s, p) => s + p.x, 0) / connectedPositions.length,
                        y: connectedPositions.reduce((s, p) => s + p.y, 0) / connectedPositions.length,
                    };
                } else {
                    barycenter = node.position || { x: 0, y: 0 };
                }

                // Spiral search to avoid overlap with nodes AND virtual obstacles
                const ternarySize = estimateNodeSize(node);
                const margin = 60;
                const overlaps = (pos) => {
                    // Check against positioned nodes
                    for (const other of allPositionedNodes) {
                        const otherSize = sizeMap.get(other.id) || estimateNodeSize(other);
                        const ox = other.position.x;
                        const oy = other.position.y;
                        if (
                            pos.x < ox + otherSize.width + margin &&
                            pos.x + ternarySize.width + margin > ox &&
                            pos.y < oy + otherSize.height + margin &&
                            pos.y + ternarySize.height + margin > oy
                        ) {
                            return true;
                        }
                    }
                    // Check against virtual obstacles (associations + loopbacks)
                    for (const obs of virtualObstacles) {
                        if (
                            pos.x < obs.x + obs.w + margin &&
                            pos.x + ternarySize.width + margin > obs.x &&
                            pos.y < obs.y + obs.h + margin &&
                            pos.y + ternarySize.height + margin > obs.y
                        ) {
                            return true;
                        }
                    }
                    return false;
                };

                let finalPos = barycenter;
                if (overlaps(finalPos)) {
                    const step = Math.max(40, Math.min(ternarySize.width, ternarySize.height) * 0.5);
                    let found = false;
                    for (let dist = step; dist < 2000 && !found; dist += step) {
                        for (let angle = 0; angle < 360 && !found; angle += 20) {
                            const candidate = {
                                x: barycenter.x + dist * Math.cos(angle * Math.PI / 180),
                                y: barycenter.y + dist * Math.sin(angle * Math.PI / 180),
                            };
                            if (!overlaps(candidate)) {
                                finalPos = candidate;
                                found = true;
                            }
                        }
                    }
                    if (!found) {
                        // Fallback: offset from barycenter
                        finalPos = { x: barycenter.x + 400, y: barycenter.y + 200 };
                    }
                }

                const positioned = { ...node, position: finalPos };
                allPositionedNodes.push(positioned);
                positionMap.set(node.id, finalPos);
                sizeMap.set(node.id, ternarySize);
            }

            // Compute handles based on final node positions
            const finalNodeMap = new Map(allPositionedNodes.map((n) => [n.id, n]));
            const pairCount = new Map();
            const allNormalEdges = [...nonTernaryEdges];
            for (const edgeList of ternaryEdgesByNode.values()) {
                allNormalEdges.push(...edgeList);
            }
            const layoutedEdges = allNormalEdges.map((edge) => {
                const sourceNode = finalNodeMap.get(edge.source);
                const targetNode = finalNodeMap.get(edge.target);
                if (!sourceNode || !targetNode) return edge;

                const pairKey = [edge.source, edge.target].sort().join('::');
                const idx = pairCount.get(pairKey) || 0;
                pairCount.set(pairKey, idx + 1);

                let handles;
                if (idx === 0) {
                    handles = determineHandles(sourceNode, targetNode);
                } else {
                    const primary = determineHandles(sourceNode, targetNode);
                    const primaryKey = `${primary.sourceHandle}-${primary.targetHandle}`;
                    const alt = HANDLE_PAIRS.filter(
                        (p) => `${p.sourceHandle}-${p.targetHandle}` !== primaryKey
                    );
                    handles = alt[(idx - 1) % alt.length];
                }

                return { ...edge, sourceHandle: handles.sourceHandle, targetHandle: handles.targetHandle };
            });

            // Re-inject loopback edges unchanged (rendered independently by CustomEdge.vue)
            const finalEdges = [...layoutedEdges, ...loopbackEdges];

            return { nodes: allPositionedNodes, edges: finalEdges };
        })
        .catch((err) => {
            console.error('ELK layout failed:', err);
            return null;
        });
};

export { getLayoutedElements, computeElkOptions, estimateNodeSize, computeAssociationSize, computeLoopbackObstacle };
