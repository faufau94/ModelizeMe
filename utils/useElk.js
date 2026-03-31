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
const computeElkOptions = (nodes, direction = 'RIGHT') => {
    let maxW = 0;
    let maxH = 0;
    for (const node of (nodes || [])) {
        const { width, height } = estimateNodeSize(node);
        if (width > maxW) maxW = width;
        if (height > maxH) maxH = height;
    }

    return {
        'elk.algorithm': 'layered',
        'elk.direction': direction,
        'elk.layered.spacing.nodeNodeBetweenLayers': String(Math.max(250, Math.round(maxW * 0.7))),
        'elk.spacing.nodeNode': String(Math.max(120, Math.round(maxH * 0.45))),
        'elk.spacing.edgeEdge': '40',
        'elk.spacing.edgeNode': '80',
        'elk.spacing.componentComponent': '150',
        'elk.edgeRouting': 'SPLINES',
        'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
        'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        'elk.separateConnectedComponents': 'true',
        'elk.layered.compaction.postCompaction.strategy': 'EDGE_LENGTH',
        'elk.padding': '[top=80,left=80,bottom=80,right=80]',
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

    // Inject phantom nodes for association entities so ELK reserves space for them.
    // An edge with data.hasNodeAssociation or non-empty data.properties gets a phantom.
    const phantomNodes = [];
    const elkEdges = [];

    for (const edge of normalEdges) {
        const hasAssoc = edge.data?.hasNodeAssociation || (edge.data?.properties?.length > 0);
        if (hasAssoc) {
            const phantomId = `phantom_${edge.id}`;
            // Size phantom to match actual MyCustomEntityAssociation component
            // Component: min-width 160px, max-width 240px, header ~40px, each row ~28px
            const propCount = edge.data?.properties?.length || 0;
            const hasTs = edge.data?.hasTimestamps ? 2 : 0;
            const hasSd = edge.data?.usesSoftDeletes ? 1 : 0;
            const totalRows = propCount + hasTs + hasSd;
            const phantomW = 250;
            const phantomH = Math.max(100, 48 + totalRows * 28);
            phantomNodes.push({ id: phantomId, width: phantomW, height: phantomH });
            // Split into two edges through the phantom node
            elkEdges.push({ id: `${edge.id}_a`, sources: [edge.source], targets: [phantomId] });
            elkEdges.push({ id: `${edge.id}_b`, sources: [phantomId], targets: [edge.target] });
        } else {
            elkEdges.push({ id: edge.id, sources: [edge.source], targets: [edge.target] });
        }
    }

    // Build a clean graph for ELK - only pass id, width, height.
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

    return elk
        .layout(graph)
        .then((layoutedGraph) => {
            // Build a position map from ELK results (skip phantom nodes for output)
            const positionMap = new Map();
            for (const child of layoutedGraph.children) {
                positionMap.set(child.id, { x: child.x, y: child.y });
            }

            // Apply new positions to the original node objects (preserving all Vue Flow properties)
            // ELK guarantees no overlap between its children — no post-processing needed.
            const finalNodes = nodes.map((node) => {
                const pos = positionMap.get(node.id);
                return { ...node, position: pos || node.position };
            });

            // Compute handles based on final node positions
            const finalNodeMap = new Map(finalNodes.map((n) => [n.id, n]));
            const pairCount = new Map();
            const layoutedEdges = normalEdges.map((edge) => {
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

            return { nodes: finalNodes, edges: finalEdges };
        })
        .catch((err) => {
            console.error('ELK layout failed:', err);
            return null;
        });
};

export { getLayoutedElements, computeElkOptions, estimateNodeSize };
