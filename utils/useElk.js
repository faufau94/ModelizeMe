import ELK from 'elkjs/lib/elk.bundled';

const elk = new ELK();

// Configuration d'ELK pour un layout structuré
const elkOptions = {
    'elk.algorithm': 'force',
    'elk.spacing.nodeNode': '100',
    'elk.layered.spacing.nodeNodeBetweenLayers': '150',
};

const getHandlePosition = (node, handleId) => {
    switch (handleId) {
        case 's1':
            return { x: node.position.x, y: node.position.y + node.height / 2 }; // Left
        case 's2':
            return { x: node.position.x + node.width / 2, y: node.position.y }; // Top
        case 's3':
            return { x: node.position.x + node.width / 2, y: node.position.y + node.height }; // Bottom
        case 's4':
            return { x: node.position.x + node.width, y: node.position.y + node.height / 2 }; // Right
        default:
            return { x: node.position.x, y: node.position.y };
    }
};

const determineHandles = (sourceNode, targetNode) => {
    const handleIds = ['s1', 's2', 's3', 's4'];
    let minDistance = Infinity;
    let bestHandles = { sourceHandle: 's4', targetHandle: 's1' }; // Valeurs par défaut

    handleIds.forEach((sourceHandleId) => {
        const sourcePosition = getHandlePosition(sourceNode, sourceHandleId);
        handleIds.forEach((targetHandleId) => {
            const targetPosition = getHandlePosition(targetNode, targetHandleId);
            const distance = Math.sqrt(
                Math.pow(targetPosition.x - sourcePosition.x, 2) +
                Math.pow(targetPosition.y - sourcePosition.y, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                bestHandles = { sourceHandle: sourceHandleId, targetHandle: targetHandleId };
            }
        });
    });

    return bestHandles;
};

const getLayoutedElements = (nodes, edges, options = {}) => {
    const graph = {
        id: 'root',
        layoutOptions: options,
        children: nodes.map((node) => ({
            ...node,
            width: node.dimensions?.width || 150,
            height: node.dimensions?.height || 50,
        })),
        edges: edges.map((edge) => {
            // Ajout des informations sur les poignées (handles) pour chaque arête
            const sourceNode = nodes.find((node) => node.id === edge.source);
            const targetNode = nodes.find((node) => node.id === edge.target);

            if (!sourceNode || !targetNode) return edge;

            const { sourceHandle, targetHandle } = determineHandles(sourceNode, targetNode);
            const sourceHandlePosition = getHandlePosition(sourceNode, sourceHandle);
            const targetHandlePosition = getHandlePosition(targetNode, targetHandle);

            return {
                ...edge,
                source: edge.source,
                target: edge.target,
                sections: [
                    {
                        startPoint: sourceHandlePosition,
                        endPoint: targetHandlePosition,
                    },
                ],
            };
        }),
    };

    return elk
        .layout(graph)
        .then((layoutedGraph) => ({
            nodes: layoutedGraph.children.map((node) => ({
                ...node,
                position: { x: node.x, y: node.y },
            })),
            edges: layoutedGraph.edges.map((edge, index) => ({
                ...edges[index],
                sections: edge.sections,
            })),
        }))
        .catch(console.error);
};

export { getLayoutedElements, elkOptions };
