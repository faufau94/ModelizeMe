import dagre from '@dagrejs/dagre';

export function useLayout(currentFlow) {
    console.log(currentFlow);
    const nodes = currentFlow.getNodes;
    const edges = currentFlow.getEdges;

    // Initialisation du graphe dagre
    const g = new dagre.graphlib.Graph();
    g.setGraph({
        nodesep: 200,  // Espace entre les nœuds
        edgesep: 400,  // Espace entre les arêtes
        ranksep: 500, // Espacement des rangs (on ne l'utilise pas ici mais nécessaire pour dagre)
        rankdir: 'TB'
    });

    g.setDefaultEdgeLabel(() => ({}));

    // Ajout des nœuds au graphe
    nodes.forEach(node => {
        g.setNode(node.id, { width: node.dimensions.width, height: node.dimensions.height });  // Taille fixe pour chaque nœud
    });

    // Ajout des arêtes au graphe
    edges.forEach(edge => {
        g.setEdge(edge.source, edge.target);
    });

    // Application du layout dagre pour réorganiser les nœuds
    dagre.layout(g);

    // Mise à jour des positions des nœuds en fonction du calcul de dagre
    const updatedNodes = nodes.map(node => {
        const dagreNode = g.node(node.id);
        return {
            ...node,
            position: {
                x: dagreNode.x - node.dimensions.width / 2,  // Ajustement pour centrer le nœud
                y: dagreNode.y - node.dimensions.height / 2,   // Ajustement pour centrer le nœud
            },
        };
    });

    function determineHandles(nodeA, nodeB) {
        const handles = {
            sourceHandle: 's4', // Valeur par défaut: Right
            targetHandle: 's1'  // Valeur par défaut: Left
        };

        // Calculer les positions relatives
        const deltaX = nodeB.position.x - nodeA.position.x;
        const deltaY = nodeB.position.y - nodeA.position.y;

        // Déterminer les handles en fonction des positions relatives
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal
            if (deltaX > 0) {
                handles.sourceHandle = 's4'; // Right
                handles.targetHandle = 's1'; // Left
            } else {
                handles.sourceHandle = 's1'; // Left
                handles.targetHandle = 's4'; // Right
            }
        } else {
            // Vertical
            if (deltaY > 0) {
                handles.sourceHandle = 's3'; // Bottom
                handles.targetHandle = 's2'; // Top
            } else {
                handles.sourceHandle = 's2'; // Top
                handles.targetHandle = 's3'; // Bottom
            }
        }

        return handles;
    }


    // Mise à jour des positions des arêtes selon les nouvelles positions des nœuds
    const updatedEdges = edges.map(edge => {
        const sourceNode = updatedNodes.find(node => node.id === edge.source);
        const targetNode = updatedNodes.find(node => node.id === edge.target);

        // Calcul des handles en fonction des positions relatives
        const handles = determineHandles(sourceNode, targetNode, updatedNodes); // Appelle ta fonction ici

        return {
            ...edge,
            sourceHandle: handles.sourceHandle,
            targetHandle: handles.targetHandle,
            sourcePosition: sourceNode ? sourceNode.position : edge.sourcePosition,
            targetPosition: targetNode ? targetNode.position : edge.targetPosition,
        };
    });

    // Retourne les nouvelles listes de nœuds et arêtes
    return {
        nodes: updatedNodes,
        edges: updatedEdges
    };
}

/*

export function useLayout(flow) {
    const graph = ref(new dagre.graphlib.Graph())

    function layout(nodes, edges, direction = 'LR') {
        const dagreGraph = new dagre.graphlib.Graph()

        dagreGraph.setDefaultEdgeLabel(() => ({}))

        const isHorizontal = direction === 'LR'
        dagreGraph.setGraph({
            rankdir: direction,        // Direction: LR (left-right) or TB (top-bottom)
            ranksep: 150,              // Augmenter la séparation verticale entre les rangs
            nodesep: 100,              // Augmenter la séparation horizontale entre les nœuds
            edgesep: 50,               // Distance entre les arêtes
            marginx: 50,               // Marges autour du graph
            marginy: 50,               // Marges autour du graph
        })

        // Ajouter les nœuds dans dagreGraph
        for (const node of nodes) {
            const graphNode = flow.findNode(node.id)
            dagreGraph.setNode(node.id, {
                width: graphNode.dimensions.width || 350,
                height: graphNode.dimensions.height || 150, // Hauteur augmentée
            })
        }

        // Ajouter les arêtes dans dagreGraph
        for (const edge of edges) {
            dagreGraph.setEdge(edge.source, edge.target)
        }

        dagre.layout(dagreGraph)

        // Appliquer le layout aux nœuds
        const updatedNodes = nodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id)

            return {
                ...node,
                targetPosition: isHorizontal ? Position.Left : Position.Top,
                sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
                position: { x: nodeWithPosition.x, y: nodeWithPosition.y },
            }
        })

        // Retourner les nœuds et les arêtes mises à jour
        return { nodes: updatedNodes, edges }
    }

    return { graph, layout }
}

 */
