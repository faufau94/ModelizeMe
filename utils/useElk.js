import ELK from 'elkjs/lib/elk.bundled';

const elk = new ELK();

/**
 * Estimate the rendered size of a node based on its actual data.
 * Calculates from the real property count so spacing is always correct.
 */
const estimateNodeSize = (node) => {
    const propertyCount = Array.isArray(node?.data?.properties) ? node.data.properties.length : 0;
    const hasTimestamps = node?.data?.hasTimestamps ? 2 : 0;
    const hasSoftDeletes = node?.data?.usesSoftDeletes ? 1 : 0;
    const rowCount = propertyCount + hasTimestamps + hasSoftDeletes;
    const isAssociation = node?.type === 'customEntityAssociation';

    const width = isAssociation ? 240 : 320;
    const baseHeight = isAssociation ? 56 : 64;
    const rowHeight = isAssociation ? 24 : 30;

    return {
        width: node?.dimensions?.width || width,
        height: node?.dimensions?.height || Math.max(baseHeight + rowCount * rowHeight, isAssociation ? 80 : 140),
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

    const nodeSpacing = Math.max(180, Math.round(Math.max(maxW, maxH) * 0.6));

    return {
        'elk.algorithm': 'force',
        'elk.force.repulsivePower': '2',
        'elk.force.iterations': '300',
        'elk.spacing.nodeNode': String(nodeSpacing),
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

    const graph = {
        id: 'root',
        layoutOptions: opts,
        children: nodes.map((node) => ({
            ...node,
            ...estimateNodeSize(node),
        })),
        edges: edges.map((edge) => ({
            ...edge,
            source: edge.source,
            target: edge.target,
        })),
    };

    return elk
        .layout(graph)
        .then((layoutedGraph) => {
            const layoutedNodes = layoutedGraph.children.map((node) => ({
                ...node,
                position: { x: node.x, y: node.y },
            }));

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
                    // Pick an alternate handle pair for subsequent edges
                    const primary = determineHandles(sourceNode, targetNode);
                    const primaryKey = `${primary.sourceHandle}-${primary.targetHandle}`;
                    // Find the next unused pair
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
