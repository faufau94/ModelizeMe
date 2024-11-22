import {computed, ref} from "vue";
import {defineStore} from "pinia";
import {getBezierPath, useVueFlow, MarkerType} from "@vue-flow/core";
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

    function nameToUpperCase(name) {
        return name.trim().toUpperCase().replace(/\s+/g, '_');
    }

    async function updateNodesEdgesMLD(idModel) {
        await $fetch(`/api/models/mld/update`, {
            method: 'PUT',
            query: { id: idModel },
            body: {
                nodes_mld: flowMLD.value.getNodes,
                edges_mld: flowMLD.value.getEdges,
            }
        });
    }

    function generateMLD(nodes = null, edges = null) {
        const mcdStore = useMCDStore();
        const {flowMCD} = mcdStore;

        // Determine whether to use provided nodes and edges or use from store
        const useTemp = nodes && edges;

        // Create appropriate flow instances
        const mcdFlow = useTemp ? useVueFlow('flow-mcd-tmp') : flowMCD;
        const mldFlow = useTemp ? useVueFlow('flow-mld-tmp') : flowMLD.value;


        console.log('mcdFlow', mcdFlow.getNodes, mcdFlow.getEdges);
        if (useTemp) {
            mcdFlow.setNodes(nodes);
            mcdFlow.setEdges(edges);
        } else {
            mldFlow.setNodes([]);
            mldFlow.setEdges([]);
        }

        // Loop through edges of MCD
        mcdFlow.getEdges.forEach(edge => {
            const edgeCopy = JSON.parse(JSON.stringify(edge));

            const sourceCardinality = edgeCopy.data.sourceCardinality.split(',');
            const targetCardinality = edgeCopy.data.targetCardinality.split(',');

            const sourceNode = JSON.parse(JSON.stringify(mcdFlow.findNode(edge.source)));
            const targetNode = JSON.parse(JSON.stringify(mcdFlow.findNode(edge.target)));

            // Convert node names to uppercase
            sourceNode.data.name = nameToUpperCase(sourceNode.data.name);
            targetNode.data.name = nameToUpperCase(targetNode.data.name);

            // Handle x:1 - 1:n and x:1 - x:1 relationships
            if ((sourceCardinality[1] === '1' && targetCardinality[1] === 'N') ||
                (sourceCardinality[1] === 'N' && targetCardinality[1] === '1') ||
                (sourceCardinality[1] === '1' && targetCardinality[1] === '1')) {

                // Add foreign key to node with x:1 cardinality
                if (sourceCardinality[1] === '1' && (targetCardinality[1] === 'N' || targetCardinality[1] === '1')) {
                    edgeCopy.markerEnd = MarkerType.ArrowClosed;
                    sourceNode.data.properties.splice(1, 0, {
                        id: uuidv4(),
                        propertyName: `${targetNode.data.name.toLowerCase()}_id`,
                        typeName: 'Foreign Key',
                        isPrimaryKey: false,
                        autoIncrement: false,
                        isForeignKey: true,
                        isNullable: false,
                    });
                } else if (sourceCardinality[1] === 'N' && targetCardinality[1] === '1') {
                    edgeCopy.markerEnd = MarkerType.ArrowClosed;
                    targetNode.data.properties.splice(1, 0, {
                        id: uuidv4(),
                        propertyName: `${sourceNode.data.name.toLowerCase()}_id`,
                        typeName: 'Foreign Key',
                        isPrimaryKey: false,
                        autoIncrement: false,
                        isForeignKey: true,
                        isNullable: false,
                    });
                }

                // Update edge type and label
                edgeCopy.type = mcdStore.edgeType;
                edgeCopy.label = edgeCopy?.name ?? '';

                // Add nodes and edge to MLD
                if (!mldFlow.findNode(sourceNode.id)) {
                    mldFlow.addNodes(sourceNode);
                }
                if (!mldFlow.findNode(targetNode.id)) {
                    mldFlow.addNodes(targetNode);
                }
                if (!mldFlow.findEdge(edgeCopy.id)) {
                    const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);
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
                    getBezierPath({
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
                        properties: [
                            {
                                id: uuidv4(),
                                propertyName: `${sourceNode.data.name.toLowerCase()}_id`,
                                typeName: 'Foreign Key',
                                isPrimaryKey: false,
                                autoIncrement: false,
                                isForeignKey: true,
                                isNullable: false,
                            },
                            {
                                id: uuidv4(),
                                propertyName: `${targetNode.data.name.toLowerCase()}_id`,
                                typeName: 'Foreign Key',
                                isPrimaryKey: false,
                                autoIncrement: false,
                                isForeignKey: true,
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
        mcdFlow.getNodes.forEach(node => {
            const copyNode = JSON.parse(JSON.stringify(node));
            copyNode.data.name = nameToUpperCase(node.data.name);

            const isNodeConnected = mcdFlow.getEdges.some(edge => edge.source === copyNode.id || edge.target === copyNode.id);
            if (!isNodeConnected && !mldFlow.findNode(copyNode.id)) {
                mldFlow.addNodes(copyNode);
            }
        });

        // destroy temporary flows
        mcdFlow.$destroy();

        // Return the results
        const newNodesMLD = JSON.parse(JSON.stringify(mldFlow.getNodes));
        const newEdgesMLD = JSON.parse(JSON.stringify(mldFlow.getEdges));
        console.log('newNodesMLD', newNodesMLD);
        console.log('newEdgesMLD', newEdgesMLD);
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