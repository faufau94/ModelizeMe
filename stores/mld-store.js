import {computed, ref} from "vue";
import {defineStore} from "pinia";
import {getBezierPath, useVueFlow, MarkerType, getSmoothStepPath} from "@vue-flow/core";
import {useMCDStore} from "./mcd-store.js";
import {v4 as uuidv4} from 'uuid';
import {useReorganize} from "../composables/useReorganize.js";

export const useMLDStore = defineStore('flow-mld', () => {

    const flowMLD = ref(null)

    function getIdNodeMLD() {
        return `dndnode_${uuidv4() + '_' + uuidv4()}`
    }

    function getIdEdgeMLD() {
        return `dndedge_${uuidv4() + '_' + uuidv4()}`
    }

    function setFlowInstance(instance) {
        flowMLD.value = instance;  // Assigner l'instance de useVueFlow
    }

    function generateMLD(nodes, edges) {
        const mcdStore = useMCDStore();


        // Create appropriate flow instances
        const mcdFlow = useVueFlow('flow-mcd-tmp')
        const mldFlow = useVueFlow('flow-mld-tmp')

        mcdFlow.setNodes(nodes);
        mcdFlow.setEdges(edges);


        // Loop through edges of MCD
        mcdFlow.getEdges.value.forEach(edge => {
            const edgeCopy = JSON.parse(JSON.stringify(edge));

            const sourceCardinality = edgeCopy.data.sourceCardinality.split(',');
            const targetCardinality = edgeCopy.data.targetCardinality.split(',');

            const sourceNode = JSON.parse(JSON.stringify(mcdFlow.findNode(edge.source)));
            const targetNode = JSON.parse(JSON.stringify(mcdFlow.findNode(edge.target)));

            // Convert node names to uppercase
            //sourceNode.data.name = nameToUpperCase(sourceNode.data.name);
            //targetNode.data.name = nameToUpperCase(targetNode.data.name);

            // Handle x:1 - 1:n and x:1 - x:1 relationships
            if ((sourceCardinality[1] === '1' && targetCardinality[1] === 'N') ||
                (sourceCardinality[1] === 'N' && targetCardinality[1] === '1') ||
                (sourceCardinality[1] === '1' && targetCardinality[1] === '1')) {


                // Déterminer le type de relation, ajouter la clé étrangère et configurer le marqueur d'edge
                edgeCopy.markerEnd = MarkerType.ArrowClosed;
                // Mettre à jour le type d'edge et son label
                edgeCopy.type = mcdStore.edgeType;
                edgeCopy.label = edgeCopy?.name ?? '';

                // Fonction pour ajouter une clé étrangère à un nœud
                const addForeignKey = (foreignTable, relationshipType) => ({
                    id: uuidv4(),
                    propertyName: `${foreignTable.data.name.toLowerCase()}_id`,
                    typeName: 'Big Integer',
                    isPrimaryKey: false,
                    autoIncrement: false,
                    isForeignKey: true,
                    foreignTable: foreignTable.data.name,
                    isNullable: false,
                    relationship: relationshipType,
                });

                const handleNodeUpdate = (node, newProperty) => {
                    const updatedNode = {
                        ...node,
                        data: {
                            ...node.data,
                            properties: [
                                ...node.data.properties.slice(0, 1), // Clé primaire
                                newProperty, // Clé étrangère
                                ...node.data.properties.slice(1) // Autres propriétés
                            ],
                        },
                    };

                    if (!mldFlow.findNode(node.id)) {
                        mldFlow.addNodes(updatedNode); // Ajouter le nœud avec les modifications
                    } else {
                        mldFlow.updateNode(node.id, (currentNode) => ({
                            ...currentNode,
                            data: {
                                ...currentNode.data,
                                properties: [
                                    ...currentNode.data.properties.slice(0, 1), // Clé primaire
                                    newProperty, // Clé étrangère
                                    ...currentNode.data.properties.slice(1) // Autres propriétés
                                ],
                            },
                        }));
                    }
                };

                // Logique principale pour déterminer où ajouter la clé étrangère
                let newProperty;
                if (sourceCardinality[1] === '1' && targetCardinality[1] === 'N') {
                    newProperty = addForeignKey(targetNode, 'OneToMany');
                    handleNodeUpdate(sourceNode, newProperty);
                } else if (sourceCardinality[1] === '1' && targetCardinality[1] === '1') {
                    newProperty = addForeignKey(targetNode, 'OneToOne');
                    handleNodeUpdate(sourceNode, newProperty);
                } else if (sourceCardinality[1] === 'N' && targetCardinality[1] === '1') {
                    newProperty = addForeignKey(sourceNode, 'ManyToOne');
                    handleNodeUpdate(targetNode, newProperty);
                }


                // Ajouter les nœuds restants s'ils ne sont pas encore dans le flux
                if (!mldFlow.findNode(sourceNode.id)) mldFlow.addNodes(sourceNode);
                if (!mldFlow.findNode(targetNode.id)) mldFlow.addNodes(targetNode);

                if (!mldFlow.findEdge(edgeCopy.id)) {
                    const {sx, sy, tx, ty, sourcePos, targetPos} = getEdgeParams(sourceNode, targetNode);
                    mldFlow.addEdges({
                        ...edgeCopy,
                        sourceX: sx,
                        sourceY: sy,
                        targetX: tx,
                        targetY: ty,
                        sourcePosition: sourcePos,
                        targetPosition: targetPos,
                    });
                }

            } else if (sourceCardinality[1] === 'N' && targetCardinality[1] === 'N') {
                // Handle n:n relationships
                let centerPosition = computed(() =>
                    getSmoothStepPath({
                        sourceX: edgeCopy.sourceX,
                        sourceY: edgeCopy.sourceY,
                        targetX: edgeCopy.targetX,
                        targetY: edgeCopy.targetY,
                    }),
                );

                let associationNode = {
                    id: getIdNodeMLD(),
                    type: 'customEntity',
                    position: {x: centerPosition.value[1] - 320 / 2, y: centerPosition.value[2]},
                    data: {
                        name: sourceNode.data.name + '_' + targetNode.data.name,
                        isAssociation: true,
                        relatedEdge: edgeCopy.id,
                        relatedEdgeSource: edgeCopy.source,
                        relatedEdgeTarget: edgeCopy.target,
                        hasTimestamps: true,
                        usesSoftDeletes: false,
                        sourceCardinality: edgeCopy.data.sourceCardinality,
                        targetCardinality: edgeCopy.data.targetCardinality,
                        relationship: 'ManyToMany',
                        relatedSourceNodeName: sourceNode.data.name,
                        relatedTargetNodeName: targetNode.data.name,
                        properties: [
                            {
                                id: uuidv4(),
                                propertyName: `${sourceNode.data.name.toLowerCase()}_id`,
                                typeName: 'Big Integer',
                                isPrimaryKey: false,
                                autoIncrement: false,
                                isForeignKey: true,
                                foreignTable: sourceNode.data.name,
                                isNullable: false,
                            },
                            {
                                id: uuidv4(),
                                propertyName: `${targetNode.data.name.toLowerCase()}_id`,
                                typeName: 'Big Integer',
                                isPrimaryKey: false,
                                autoIncrement: false,
                                isForeignKey: true,
                                foreignTable: targetNode.data.name,
                                isNullable: false,
                            },
                            ...(edgeCopy?.data?.properties || [])
                        ]
                    }
                };

                const calculateHandlesNewNode =
                    mcdStore.determineHandles(mcdFlow.findNode(edgeCopy.source), mcdFlow.findNode(edgeCopy.target), associationNode);

                let newEdge1 = {
                    id: getIdEdgeMLD(),
                    source: sourceNode.id,
                    target: associationNode.id,
                    sourceHandle: edgeCopy.sourceHandle,
                    targetHandle: calculateHandlesNewNode.sourceHandle,
                    type: mcdStore.edgeType,
                    markerStart: MarkerType.ArrowClosed,
                    style: null,
                    data: {
                        name: '',
                        isFromAssociation: true,
                        isAssociation: true,
                        edgePart: 1,
                        sourceCardinality: '',
                        targetCardinality: '',
                        properties: []
                    }
                };

                let newEdge2 = {
                    id: getIdEdgeMLD(),
                    source: associationNode.id,
                    target: targetNode.id,
                    sourceHandle: calculateHandlesNewNode.targetHandle,
                    targetHandle: edgeCopy.targetHandle,
                    type: mcdStore.edgeType,
                    markerEnd: MarkerType.ArrowClosed,
                    style: null,
                    data: {
                        name: '',
                        isFromAssociation: true,
                        isAssociation: true,
                        edgePart: 2,
                        sourceCardinality: '',
                        targetCardinality: '',
                        properties: []
                    }
                };

                // Add association node and edges to MLD
                if (!mldFlow.findNode(sourceNode.id)) {
                    mldFlow.addNodes(sourceNode);
                }
                if (!mldFlow.findNode(targetNode.id)) {
                    mldFlow.addNodes(targetNode);
                }
                mldFlow.addNodes(associationNode);
                mldFlow.addEdges([newEdge1, newEdge2]);
            }
        });

        // Add orphan nodes
        mcdFlow.getNodes.value.forEach(node => {
            const copyNode = JSON.parse(JSON.stringify(node));
            //copyNode.data.name = nameToUpperCase(node.data.name);

            const isNodeConnected = mcdFlow.getEdges.value.some(edge => edge.source === copyNode.id || edge.target === copyNode.id);
            if (!isNodeConnected && !mldFlow.findNode(copyNode.id)) {
                mldFlow.addNodes(copyNode);
            }
        });

        // destroy temporary flows
        mcdFlow.$destroy();

        // Return the results
        const newNodesMLD = JSON.parse(JSON.stringify(mldFlow.getNodes.value));
        const newEdgesMLD = JSON.parse(JSON.stringify(mldFlow.getEdges.value));

        mldFlow.$destroy();
        return {
            nodesMLD: newNodesMLD,
            edgesMLD: newEdgesMLD
        };
    }


    return {
        flowMLD,
        generateMLD,
        setFlowInstance
    }
})