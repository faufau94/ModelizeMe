import ELK from 'elkjs/lib/elk.bundled';
import { resolveCollisions } from './useCollisions.js';

const elk = new ELK();

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

    const width = isAssociation ? 280 : 340;
    const baseHeight = isAssociation ? 70 : 80;
    const rowHeight = isAssociation ? 28 : 32;

    return {
        width: width,
        height: Math.max(baseHeight + rowCount * rowHeight, isAssociation ? 120 : 160),
    };
};

/**
 * Compute dynamic ELK options from the actual nodes.
 * Spacing is derived from the tallest/widest node so nothing overlaps,
 * including the association entity boxes that sit at edge midpoints.
 */
const computeElkOptions = (nodes) => {
    let maxW = 0;
    let maxH = 0;
    for (const node of (nodes || [])) {
        const { width, height } = estimateNodeSize(node);
        if (width > maxW) maxW = width;
        if (height > maxH) maxH = height;
    }

    return {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.layered.spacing.nodeNodeBetweenLayers': String(Math.max(180, Math.round(maxW * 0.6))),
        'elk.spacing.nodeNode': String(Math.max(80, Math.round(maxH * 0.4))),
        'elk.spacing.edgeEdge': '40',
        'elk.spacing.edgeNode': '60',
        'elk.spacing.componentComponent': '120',
        'elk.edgeRouting': 'ORTHOGONAL',
        'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
        'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
        'elk.layered.nodePlacement.bk.edgeStraightening': 'IMPROVE_STRAIGHTNESS',
        'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
        'elk.separateConnectedComponents': 'true',
        'elk.layered.compaction.postCompaction.strategy': 'EDGE_LENGTH',
        'elk.padding': '[top=40,left=40,bottom=40,right=40]',
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
    const opts = options || computeElkOptions(nodes);

    // Inject phantom nodes for association entities so ELK reserves space for them.
    // An edge with data.hasNodeAssociation or non-empty data.properties gets a phantom.
    const phantomNodes = [];
    const elkEdges = [];
    const phantomEdgeIds = new Set();

    for (const edge of edges) {
        const hasAssoc = edge.data?.hasNodeAssociation || (edge.data?.properties?.length > 0);
        if (hasAssoc) {
            const phantomId = `phantom_${edge.id}`;
            // Size phantom to match actual association entity content
            const propCount = edge.data?.properties?.length || 0;
            const phantomW = 200;
            const phantomH = Math.max(100, 60 + propCount * 28);
            phantomNodes.push({ id: phantomId, width: phantomW, height: phantomH });
            phantomEdgeIds.add(edge.id);
            // Split into two edges through the phantom node
            elkEdges.push({ id: `${edge.id}_a`, sources: [edge.source], targets: [phantomId] });
            elkEdges.push({ id: `${edge.id}_b`, sources: [phantomId], targets: [edge.target] });
        } else {
            elkEdges.push({ id: edge.id, sources: [edge.source], targets: [edge.target] });
        }
    }

    // Build a clean graph for ELK — only pass id, width, height.
    // Never pass reactive Vue Flow objects to ELK.
    const graph = {
        id: 'root',
        layoutOptions: opts,
        children: [
            ...nodes.map((node) => {
                const size = estimateNodeSize(node);
                return { id: node.id, width: size.width, height: size.height };
            }),
            ...phantomNodes,
        ],
        edges: elkEdges,
    };

    // Keep a lookup of the original nodes/edges so we can patch them.
    const originalNodeMap = new Map(nodes.map((n) => [n.id, n]));

    return elk
        .layout(graph)
        .then((layoutedGraph) => {
            // Build a position map from ELK results (skip phantom nodes for output)
            const positionMap = new Map();
            for (const child of layoutedGraph.children) {
                positionMap.set(child.id, { x: child.x, y: child.y });
            }

            // Apply new positions to the original node objects (preserving all Vue Flow properties)
            const layoutedNodes = nodes.map((node) => {
                const pos = positionMap.get(node.id);
                return { ...node, position: pos || node.position };
            });

            // Build phantom node objects with their ELK positions for collision resolution
            const phantomLayouted = phantomNodes.map((ph) => {
                const pos = positionMap.get(ph.id);
                return { id: ph.id, position: pos || { x: 0, y: 0 }, dimensions: { width: ph.width, height: ph.height }, _phantom: true };
            });

            // Post-process: resolve overlaps including phantom (association) nodes
            const allForCollision = [...layoutedNodes, ...phantomLayouted];
            const resolvedAll = resolveCollisions(allForCollision, { margin: 20 });
            const finalNodes = resolvedAll.filter((n) => !n._phantom);

            // Recompute handles after collision resolution may have shifted nodes
            const finalNodeMap = new Map(finalNodes.map((n) => [n.id, n]));
            const finalPairCount = new Map();
            const finalEdges = edges.map((edge) => {
                const sourceNode = finalNodeMap.get(edge.source);
                const targetNode = finalNodeMap.get(edge.target);
                if (!sourceNode || !targetNode) return edge;

                const pairKey = [edge.source, edge.target].sort().join('::');
                const idx = finalPairCount.get(pairKey) || 0;
                finalPairCount.set(pairKey, idx + 1);

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

            return { nodes: finalNodes, edges: finalEdges };
        })
        .catch(console.error);
};

export { getLayoutedElements, computeElkOptions, estimateNodeSize };
