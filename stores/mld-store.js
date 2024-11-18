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

    function generateMLD() {

        // 1. vider flowMLD
        // 2. faire une boucle des edges de flowMCD
        // 3. pour chaque edge, vérifier si le cardinalité est x:1 - x:n et ajouter la clé étrangère au noeud x:1
        // 4. si cardinalité est x:1 - x:1, ajouter la clé étrangère au noeud x:1
        // 5. si cardinalité est x:n - x:n, ajouter un noeud central avec les clés primaires des deux noeuds
        // 6. vérifier si un noeud ou un edge existe déjà dans flowMLD, si oui, ne pas l'ajouter
        // 7. ajouter les noeuds et les edges dans flowMLD (aussi les nodes orphelins, c'est-à-dire les nodes qui n'ont pas de edges)


        const mcdStore = useMCDStore();
        const {flowMCD} = mcdStore;

        // 1. Vider flowMLD
        flowMLD.value.setNodes([]);
        flowMLD.value.setEdges([]);

        // 2. Boucle sur les edges de flowMCD

        flowMCD.getEdges.forEach(edge => {
            const edgeCopy = JSON.parse(JSON.stringify(edge));

            const sourceCardinality = edgeCopy.data.sourceCardinality.split(',');
            const targetCardinality = edgeCopy.data.targetCardinality.split(',');

            console.log('edgeCopy', edgeCopy);
            console.log('sourceCardinality', sourceCardinality);
            console.log('targetCardinality', targetCardinality);

            const sourceNode = JSON.parse(JSON.stringify(flowMCD.findNode(edge.source)));
            const targetNode = JSON.parse(JSON.stringify(flowMCD.findNode(edge.target)));

            // make the name of the node to uppercase
            sourceNode.data.name = nameToUpperCase(sourceNode.data.name);
            targetNode.data.name = nameToUpperCase(targetNode.data.name);

            // 3. Gestion des relations x:1 - 1:n et x:1 - x:1
            if ((sourceCardinality[1] === '1' && targetCardinality[1] === 'N') ||
                (sourceCardinality[1] === 'N' && targetCardinality[1] === '1') ||
                (sourceCardinality[1] === '1' && targetCardinality[1] === '1')) {
                console.log('Gestion des relations x:1 - 1:n et x:1 - x:1')
                console.log('sourceCardinality', sourceCardinality);
                console.log('targetCardinality', targetCardinality);


                // Ajouter la clé étrangère au nœud ayant la cardinalité x:1
                if(sourceCardinality[1] === '1' && targetCardinality[1] === 'N' ||
                   sourceCardinality[1] === '1' && targetCardinality[1] === '1') {
                    edgeCopy.markerEnd = MarkerType.ArrowClosed;
                    sourceNode.data.properties.splice(1, 0, {
                        id: uuidv4(),
                        propertyName: `${targetNode.data.name.toLowerCase()}_id`,
                        typeName: 'Foreign Key',
                        isPrimaryKey: false,
                        autoIncrement: false,
                        isForeignKey: true
                    });
                } else if(sourceCardinality[1] === 'N' && targetCardinality[1] === '1') {
                    edgeCopy.markerEnd = MarkerType.ArrowClosed;
                    targetNode.data.properties.splice(1, 0, {
                        id: uuidv4(),
                        propertyName: `${sourceNode.data.name.toLowerCase()}_id`,
                        typeName: 'Foreign Key',
                        isPrimaryKey: false,
                        autoIncrement: false,
                        isForeignKey: true
                    });
                }

                // update edge type
                edgeCopy.type = mcdStore.edgeType;
                edgeCopy.label = edgeCopy?.name ?? '';

                // Vérifier et ajouter les nœuds dans flowMLD
                // Ajouter l'edge et les deux nodes en question dans flowMLD
                if (!flowMLD.value.findNode(sourceNode.id)) {
                    flowMLD.value.addNodes(sourceNode);
                }
                if (!flowMLD.value.findNode(targetNode.id)) {
                    flowMLD.value.addNodes(targetNode);
                }
                if (!flowMLD.value.findEdge(edgeCopy.id)) {

                    // Get the best edge position
                    const {
                        sx,
                        sy,
                        tx,
                        ty,
                        sourcePos,
                        targetPos,
                    } = getEdgeParams(sourceNode, targetNode)

                    console.log(edgeCopy)
                    console.log('juste après')
                    console.log(sourceNode, targetNode, sx, sy, tx, ty, sourcePos, targetPos)

                    flowMLD.value.addEdges({
                        ...edgeCopy,
                        sourceX: sx,
                        sourceY: sy,
                        targetX: tx,
                        targetY: ty,
                        sourcePosition: sourcePos,
                        targetPosition: targetPos,
                    });
                }


                // 4. Gestion des relations n:n
            } else if (sourceCardinality[1] === 'N' && targetCardinality[1] === 'N') {

                let centerPosition = computed(() =>
                    getBezierPath({
                        sourceX: edgeCopy.sourceX,
                        sourceY: edgeCopy.sourceY,
                        targetX: edgeCopy.targetX,
                        targetY: edgeCopy.targetY,
                    }),
                )


                let associationNode = {
                    id: getIdNodeMLD(),
                    type: 'customEntity',
                    position: {x: centerPosition.value[1] - 320 / 2, y: centerPosition.value[2]},
                    data: {
                        name: nameToUpperCase(edgeCopy.data.name),
                        isAssociation: true,
                        relatedEdge: edgeCopy.id,
                        relatedEdgeSource: edgeCopy.source,
                        relatedEdgeTarget: edgeCopy.target,
                        properties: [
                            // first key attribute (foreign keys)
                            {
                                id: uuidv4(),
                                propertyName: `${sourceNode.data.name.toLowerCase()}_id`,
                                typeName: 'Foreign Key',
                                isPrimaryKey: false,
                                autoIncrement: false,
                                isForeignKey: true
                            },
                            {
                                id: uuidv4(),
                                propertyName: `${targetNode.data.name.toLowerCase()}_id`,
                                typeName: 'Foreign Key',
                                isPrimaryKey: false,
                                autoIncrement: false,
                                isForeignKey: true
                            },
                            ...(edgeCopy?.data?.properties || [])
                        ]
                    }
                };

                // create two edge : one between firstnode and newNode, the second between newnode and secondnode
                const calculateHandlesNewNode =
                    mcdStore.determineHandles(flowMCD.findNode(edgeCopy.source), flowMCD.findNode(edgeCopy.target), associationNode);


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
                        // Define which part of the association relationship comes from
                        edgePart: 1,
                        sourceCardinality: '',
                        targetCardinality: '',
                        properties: []
                    }
                }


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
                }


                // we add the association node to the list of nodes, with the two edges, with the two nodes
                if (!flowMLD.value.findNode(sourceNode.id)) {
                    flowMLD.value.addNodes(sourceNode);
                }
                if (!flowMLD.value.findNode(targetNode.id)) {
                    flowMLD.value.addNodes(targetNode);
                }
                flowMLD.value.addNodes(associationNode);
                flowMLD.value.addEdges([newEdge1, newEdge2]);

            }
        });


        // 7. Ajouter les nodes orphelins

        flowMCD.getNodes.forEach(node => {

            const copyNode = JSON.parse(JSON.stringify(node));

            copyNode.data.name = nameToUpperCase(node.data.name);

            const isNodeConnected = flowMCD.getEdges.some(edge => edge.source === copyNode.id || edge.target === copyNode.id);
            if (!isNodeConnected && !flowMLD.value.findNode(copyNode.id)) {
                flowMLD.value.addNodes(copyNode);
            }
        });

        /*
        const { reorganizeNodesAndEdges } = useReorganize(flowMLD.value);

        // Applique la réorganisation des nodes pour éviter les chevauchements
        const { nodes, edges } = reorganizeNodesAndEdges();


        flowMLD.value.setNodes(nodes);
        flowMLD.value.setEdges(edges);

         */
        /*
        const { nodes, edges } = useLayout(flowMLD.value);
        flowMLD.value.setNodes(nodes);
        flowMLD.value.setEdges(edges);
         */
    }

    // function generateMLD() {
    //     const mcdStore = useMCDStore()
    //     const {flowMCD} = mcdStore
    //
    //     // 1. vider flowMLD
    //     // 2. faire une boucle des edges de flowMCD
    //     // 3. pour chaque edge, vérifier si le cardinalité est x,1 - x,n et ajouter la clé étrangère au noeud x,1
    //     // 4. si cardinalité est x,1 - x,1, ajouter la clé étrangère au noeud x,1
    //     // 5. si cardinalité est x,n - x,n, ajouter un noeud central avec les clés primaires des deux noeuds
    //     // 6. vérifier si un noeud ou un edge existe déjà dans flowMLD, si oui, ne pas l'ajouter
    //     // 7. ajouter les noeuds et les edges dans flowMLD
    //
    //     flowMLD.value.removeNodes(flowMLD.value.nodes.value, true)
    //
    //     flowMCD.getEdges.forEach(edge => {
    //         let edgeDatas = JSON.parse(JSON.stringify(edge.data))
    //
    //         // First case : x,1 - x,n and second case : x,1 - x,1
    //         let getSecondElementSource = edgeDatas.sourceCardinality.split(',')[1]
    //         let getSecondElementTarget = edgeDatas.targetCardinality.split(',')[1]
    //
    //         let extractedSecondElement = [getSecondElementSource, getSecondElementTarget]
    //
    //         let getIdFirstNode = '';
    //         let getIdSecondNode = '';
    //
    //         if ((extractedSecondElement.includes('1') && extractedSecondElement.includes('n')) ||
    //             (extractedSecondElement[0] === '1' && extractedSecondElement[1] === '1')) {
    //
    //             if (extractedSecondElement.includes('1') && extractedSecondElement.includes('n')) {
    //                 // get node (source or target) which have 1,1 to add foreign key
    //                 if (edgeDatas.sourceCardinality.split(',')[1] === '1') {
    //                     getIdFirstNode = edge.source
    //                     getIdSecondNode = edge.target
    //                 } else {
    //                     getIdFirstNode = edge.target
    //                     getIdSecondNode = edge.source
    //                 }
    //
    //             } else if (extractedSecondElement[0] === '1' && extractedSecondElement[1] === '1') {
    //                 // get any of these nodes (source or target) which have 1,1 to add foreign key
    //                 getIdFirstNode = edge.source
    //                 getIdSecondNode = edge.target
    //             }
    //
    //
    //             // check is node already exists in MLD
    //             let firstNode = JSON.parse(JSON.stringify(flowMLD.value.findNode(getIdFirstNode) === undefined ?
    //                 flowMCD.findNode(getIdFirstNode) :
    //                 flowMLD.value.findNode(getIdFirstNode)))
    //
    //             let secondNode = JSON.parse(JSON.stringify(flowMLD.value.findNode(getIdSecondNode) === undefined ?
    //                 flowMCD.findNode(getIdSecondNode) :
    //                 flowMLD.value.findNode(getIdSecondNode)))
    //
    //             // add foreign key
    //             firstNode.data.properties = [
    //                 ...firstNode.data.properties,
    //                 {
    //                     propertyName: `${secondNode.data.name}`,
    //                     typeName: 'Foreign Key'
    //                 },
    //             ]
    //
    //
    //             //firstNode.template = MyCustomEntityMLD
    //             //secondNode.template = MyCustomEntityMLD
    //
    //
    //             // Remove empty property and type name
    //             firstNode.data.properties = firstNode.data.properties.filter(el => el.propertyName !== "" && el.typeName !== "")
    //             secondNode.data.properties = secondNode.data.properties.filter(el => el.propertyName !== "" && el.typeName !== "")
    //
    //             let newNodesList = [
    //                 ...flowMLD.value.getNodes,
    //                 firstNode,
    //                 secondNode
    //             ]
    //
    //             flowMLD.value.setNodes(newNodesList)
    //
    //         } else if (extractedSecondElement[0] === 'n' && extractedSecondElement[1] === 'n') {
    //             //Third case : x,n - x,n
    //
    //             // Get the source and target nodes
    //             getIdFirstNode = edge.source
    //             getIdSecondNode = edge.target
    //
    //             let firstNode = JSON.parse(JSON.stringify(flowMCD.findNode(getIdFirstNode)))
    //             let secondNode = JSON.parse(JSON.stringify(flowMCD.findNode(getIdSecondNode)))
    //
    //
    //             // get center edge with the two nodes (for adding the central node)
    //             let centerEdge = computed(() =>
    //                 getStraightPath({
    //                     sourceX: edge.sourceNode.x,
    //                     sourceY: edge.sourceNode.y,
    //                     targetX: edge.targetNode.x,
    //                     targetY: edge.targetNode.y,
    //                 }),
    //             )
    //             //let position = flowMLD.value.project({x: centerEdge.value[0], y: centerEdge.value[1]})
    //
    //             // create new node with primaries keys
    //             /*
    //             let newNode = {
    //               id: `node_${genRand(10)}`,
    //               type,
    //               position,
    //               template: markRaw(MyCustomEntityMLD),
    //               x: position.x,
    //               y: position.y,
    //               data: {
    //                 name: `${firstNode.data.name}_${secondNode.data.name}`,
    //                 properties: [
    //                   // first key attribute (primary key)
    //                   firstNode.data.properties[0],
    //                   secondNode.data.properties[0],
    //                   ...edgeDatas.properties
    //                 ]
    //               }
    //             }
    //              */
    //
    //             let newNode = {
    //                 id: getIdNodeMLD(),
    //                 type: 'customEntityAssociation',
    //                 position: {x: centerEdge[1] - 320 / 2, y: centerEdge[2]},
    //                 data: {
    //                     name: `${firstNode.data.name}_${secondNode.data.name}`,
    //                     isAssociation: true,
    //                     relatedEdge: edge.id,
    //                     relatedEdgeSource: edge.source,
    //                     relatedEdgeTarget: edge.target,
    //                     properties: [
    //                         // first key attribute (primary key)
    //                         firstNode.data.properties[0],
    //                         secondNode.data.properties[0],
    //                         ...edgeDatas.data.properties
    //                     ]
    //                 }
    //             };
    //
    //
    //             //firstNode.template = MyCustomEntityMLD
    //             //secondNode.template = MyCustomEntityMLD
    //
    //
    //             // Remove empty property and type name
    //             firstNode.data.properties = firstNode.data.properties.filter(el => el.propertyName !== "" && el.typeName !== "")
    //             secondNode.data.properties = secondNode.data.properties.filter(el => el.propertyName !== "" && el.typeName !== "")
    //             newNode.data.properties = newNode.data.properties.filter(el => el.propertyName !== "" && el.typeName !== "")
    //
    //             let newNodesList = [
    //                 ...flowMLD.value.getNodes,
    //                 firstNode,
    //                 secondNode,
    //                 newNode,
    //             ]
    //
    //             flowMLD.value.setNodes(newNodesList)
    //
    //             // create two edge : one between firstnode and newNode, the second between newnode and secondnode
    //
    //             const calculateHandlesNewNode =
    //                 mcdStore.determineHandles(flowMCD.findNode(edge.source), flowMCD.findNode(edge.target), newNode);
    //
    //
    //             let newEdge1 = {
    //                 id: getIdEdgeMLD(),
    //                 source: edge.source,
    //                 target: newNode.id,
    //                 sourceHandle: edge.sourceHandle,
    //                 targetHandle: calculateHandlesNewNode.sourceHandle,
    //                 type: edgeType.value,
    //                 style: null,
    //                 data: {
    //                     name: '',
    //                     isFromAssociation: true,
    //                     isAssociation: true,
    //                     // Define which part of the association relationship comes from
    //                     edgePart: 1,
    //                     sourceCardinality: '',
    //                     targetCardinality: '',
    //                     properties: []
    //                 }
    //             }
    //
    //
    //             let newEdge2 = {
    //                 id: getIdEdgeMLD(),
    //                 source: newNode.id,
    //                 target: edge.target,
    //                 targetHandle: edge.targetHandle,
    //                 sourceHandle: calculateHandlesNewNode.targetHandle,
    //                 type: edgeType.value,
    //                 updatable: true,
    //                 style: null,
    //                 label: edge.data?.targetCardinality ?? '',
    //                 labelBgStyle: {fill: '#F2F5F7'},
    //                 data: {
    //                     name: '',
    //                     isFromAssociation: true,
    //                     isAssociation: true,
    //                     edgePart: 2,
    //                     sourceCardinality: '',
    //                     targetCardinality: '',
    //                     properties: []
    //                 }
    //             }
    //             flowMLD.value.addEdges([newEdge1, newEdge2])
    //
    //
    //         }
    //
    //         // edge part
    //         if (!(extractedSecondElement[0] === 'n' && extractedSecondElement[1] === 'n')) {
    //             // Add edges node from mcd into mld
    //             /*
    //             let edgeCopy = JSON.parse(JSON.stringify(edge))
    //             delete edgeCopy.template
    //
    //             edgeCopy = {
    //               ...edgeCopy,
    //               label: edgeCopy.data.name
    //             }
    //             let newEdgesList = [
    //               ...flowMLD.value.edges.value,
    //               edgeCopy
    //             ]
    //
    //              */
    //             let edgeCopy = JSON.parse(JSON.stringify(edge))
    //             edgeCopy.data.sourceCardinality = ''
    //             edgeCopy.data.targetCardinality = ''
    //             flowMLD.value.addEdges(edgeCopy)
    //         }
    //
    //
    //     })
    //
    // }



    return {
        flowMLD,
        generateMLD,
        setFlowInstance
    }
})