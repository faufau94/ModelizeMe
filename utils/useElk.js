import ELK from 'elkjs/lib/elk.bundled';

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

    const width = isAssociation ? 260 : 340;
    const baseHeight = isAssociation ? 60 : 80;
    const rowHeight = isAssociation ? 26 : 32;

    return {
        width: width,
        height: Math.max(baseHeight + rowCount * rowHeight, isAssociation ? 100 : 160),
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
        'elk.layered.noOverlap': 'true',
        'elk.spacing.nodeNode': String(Math.max(80, Math.round(maxH * 0.4))),
        'elk.layered.spacing.nodeNodeBetweenLayers': String(Math.max(250, Math.round(maxW * 0.8))),
        'elk.spacing.edgeEdge': '30',
        'elk.spacing.edgeNode': '80',
        'elk.spacing.componentComponent': '120',
        'elk.edgeRouting': 'ORTHOGONAL',
        'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
        'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
        'elk.separateConnectedComponents': 'true',
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

    // Build a clean graph for ELK — only pass id, width, height.
    // Never pass reactive Vue Flow objects to ELK.
    const graph = {
        id: 'root',
        layoutOptions: opts,
        children: nodes.map((node) => {
            const size = estimateNodeSize(node);
            return { id: node.id, width: size.width, height: size.height };
        }),
        edges: edges.map((edge) => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target],
        })),
    };

    // Keep a lookup of the original nodes/edges so we can patch them.
    const originalNodeMap = new Map(nodes.map((n) => [n.id, n]));

    return elk
        .layout(graph)
        .then((layoutedGraph) => {
            // Build a position map from ELK results
            const positionMap = new Map();
            for (const child of layoutedGraph.children) {
                positionMap.set(child.id, { x: child.x, y: child.y });
            }

            // Apply new positions to the original node objects (preserving all Vue Flow properties)
            const layoutedNodes = nodes.map((node) => {
                const pos = positionMap.get(node.id);
                return { ...node, position: pos || node.position };
            });

            const nodeMap = new Map(layoutedNodes.map((n) => [n.id, n]));

            // Track how many edges share the same source-target pair
            // so we can assign different handle combos to each.
            const pairCount = new Map();

            const layoutedEdges = edges.map((edge) => {
                const sourceNode = nodeMap.get(edge.source);
                const targetNode = nodeMap.get(edge.target);
                if (!sourceNode || !targetNode) return edge;

                // Canonical key for the pair (order-independent)
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

            return { nodes: layoutedNodes, edges: layoutedEdges };
        })
        .catch(console.error);
};

export { getLayoutedElements, computeElkOptions, estimateNodeSize };
