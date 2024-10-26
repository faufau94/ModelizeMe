/*
export function useReorganize(currentFlow) {
    const nodes = currentFlow.nodes; // Liste des nœuds
    const edges = currentFlow.edges; // Liste des arêtes

    // Fonction pour organiser les nœuds manuellement
    const organizedNodes = nodes.map((node, index) => {
        const spacingX = 400; // Espacement horizontal
        const spacingY = 400; // Espacement vertical

        return {
            ...node,
            position: {
                // Chaque nœud est placé avec un espacement basé sur son index
                x: (node.dimensions.width + spacingX) * (index % 3), // Trois colonnes
                y: Math.floor(index / 3) * (node.dimensions.height + spacingY), // Organiser en lignes
            },
        };
    });

    // Fonction pour ajuster les arêtes selon la position des nœuds
    const organizedEdges = edges.map(edge => {
        const sourceNode = organizedNodes.find(node => node.id === edge.source);
        const targetNode = organizedNodes.find(node => node.id === edge.target);

        if (!sourceNode || !targetNode) return edge; // Vérifier que les nœuds existent

        const deltaX = targetNode.position.x - sourceNode.position.x;
        const deltaY = targetNode.position.y - sourceNode.position.y;

        let sourceHandle = 's3'; // Par défaut en bas
        let targetHandle = 's2'; // Par défaut en haut

        // Si les nœuds sont plus éloignés horizontalement que verticalement
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                sourceHandle = 's4'; // Droite du nœud source
                targetHandle = 's1'; // Gauche du nœud cible
            } else {
                sourceHandle = 's1'; // Gauche du nœud source
                targetHandle = 's4'; // Droite du nœud cible
            }
        } else {
            if (deltaY > 0) {
                sourceHandle = 's3'; // Bas du nœud source
                targetHandle = 's2'; // Haut du nœud cible
            } else {
                sourceHandle = 's2'; // Haut du nœud source
                targetHandle = 's3'; // Bas du nœud cible
            }
        }

        return {
            ...edge,
            sourceHandle,
            targetHandle,
            sourcePosition: sourceNode ? sourceNode.position : edge.sourcePosition,
            targetPosition: targetNode ? targetNode.position : edge.targetPosition,
        };
    });

    // Retourne les nouvelles listes de nœuds et arêtes
    return {
        nodes: organizedNodes,
        edges: organizedEdges,
    };
}
*/
/*
export function useReorganize(flowInstance) {
    // Espacement minimal entre les nœuds pour éviter les chevauchements
    const spacingX = 100;
    const spacingY = 100;

    // Fonction pour ajuster la position d'un nœud s'il y a un chevauchement
    const adjustPosition = (node) => {
        let intersections = flowInstance.getIntersectingNodes(node);

        // Continue d'ajuster la position tant qu'il y a des chevauchements
        while (intersections.length > 0) {
            // Déplacement de l'emplacement pour éviter les chevauchements
            node.position.x += spacingX;
            node.position.y += spacingY;

            // Mise à jour de la position du nœud dans Vue Flow
            flowInstance.updateNode(node.id, { position: node.position });

            // Vérifier de nouveau s'il y a toujours des intersections
            intersections = flowInstance.getIntersectingNodes(node);
        }
    };

    // Fonction principale pour réorganiser les nœuds et les arêtes
    const reorganizeNodesAndEdges = () => {
        const nodes = flowInstance.getNodes;
        const edges = flowInstance.getEdges;

        // Réorganiser chaque nœud pour éviter les chevauchements
        nodes.forEach((node) => {
            adjustPosition(node);
        });

        // Pas besoin de changer directement les arêtes ici, sauf si des ajustements supplémentaires sont nécessaires
        return { nodes, edges };
    };

    return {
        reorganizeNodesAndEdges,
    };
}

 */

export function useReorganize(flowInstance) {
    // Espacement fixe entre les nœuds
    const spacingX = 300;
    const spacingY = 200;

    // Fonction pour réorganiser les nœuds en une grille simple, sans chevauchements
    const reorganizeNodesAndEdges = () => {
        const nodes = flowInstance.getNodes; // Accès direct aux nœuds
        const edges = flowInstance.getEdges; // Accès direct aux arêtes

        let xPosition = 0;
        let yPosition = 0;

        // Réorganisation en plaçant chaque nœud avec un espacement défini
        nodes.forEach((node, index) => {
            // Calculer la nouvelle position
            node.position.x = xPosition;
            node.position.y = yPosition;

            // Mise à jour de la position du nœud dans flowInstance
            flowInstance.updateNode(node.id, { position: { x: xPosition, y: yPosition } });

            // Passer au nœud suivant sur la grille
            xPosition += node.dimensions.width + spacingX;

            // Aller à la ligne suivante si on dépasse une certaine largeur (par exemple 1200px)
            if (xPosition > 1200) {
                xPosition = 0; // Revenir à gauche
                yPosition += node.dimensions.height + spacingY; // Passer à la ligne suivante
            }
        });

        // Retourner les nœuds et les arêtes mises à jour
        return { nodes, edges };
    };

    return {
        reorganizeNodesAndEdges,
    };
}
