import {computed, ref} from "vue";
import {defineStore} from "pinia";
import {getStraightPath, useVueFlow} from "@vue-flow/core";
import { v4 as uuidv4 } from 'uuid';

export const useMCDStore = defineStore('flow-mcd', () => {


    const flowMCD = ref(null)

    const isSubMenuVisible = ref(false)
    const elementsMenu = ref(false)
    const models = ref([])
    const nodeIdSelected = ref(null)
    const edgeIdSelected = ref(null)

    const addNewNode = ref(false)


    const edgeTypes = ref(['smoothstep', 'straight', 'step', 'curve'])
    const edgeType = ref('straight')

    function getIdNode() {
        return `dndnode_${uuidv4() + '_' + uuidv4()}`
    }

    function getIdEdge() {
        return `dndedge_${uuidv4()+ '_' + uuidv4()}`
    }

    function setFlowInstance(instance) {
        flowMCD.value = instance;  // Assigner l'instance de useVueFlow
    }

    function createNewNode(position = null) {
        let nodeId = getIdNode()

        return {
            id: nodeId,
            type: 'customEntity',
            position: position !== null ? position  : {x: Math.random() * 500, y: Math.random() * 500},
            draggable: true,
            selected: false,
            data: {
                name: '',
                properties: [
                    {
                        propertyName: "id",
                        typeName: "Big Increment",
                    },
                ]
            }
        }
    }

    async function addNode(idModel, duplicatedNode = null) {

        addNewNode.value = true
        let newNode = duplicatedNode !== null ? duplicatedNode : createNewNode()

        const res = await $fetch(`/api/models/update`, {
            method: 'PUT',
            query: { id: idModel },
            body: {
                node: newNode,
                type: 'node'
            }
        });


        flowMCD.value.addNodes(newNode)

        isSubMenuVisible.value = true
        elementsMenu.value = false
        nodeIdSelected.value = newNode.id

        addNewNode.value = false

    }

    async function removeNode(idModel, idNode) {
        await $fetch(`/api/models/delete`, {
            method: 'DELETE',
            query: { idModel: idModel, idNode: idNode },
            body: {
                type: 'node',
                action: 'removeNode'
            }
        });
        flowMCD.value.removeNodes(idNode, true, true);
        isSubMenuVisible.value = false
    }

    async function updateNode(idModel, idNode) {
        const node = flowMCD.value.findNode(idNode)
        node.selected = false
        await $fetch(`/api/models/update`, {
            method: 'PUT',
            query: { id: idModel },
            body: {
                node: node,
                type: 'node',
                action: 'updateNode'
            }
        });
    }

    /*
    function addAssociation() {
        const {findEdge, findNode, addNodes, addEdges, removeEdges} = useVueFlow('flow-mcd')

        // get selected edge infos
        let edge = findEdge(edgeIdSelected.value)

        let getEdgeCenter = getStraightPath(edge);

        let newNodeId = getIdNode()
        let firstEdgeId = getIdEdge()
        let secondEdgeId = getIdEdge()


        // remove selected edge
        removeEdges(edge)

        // Create the node association

        console.log('firstEdgeId', firstEdgeId)
        console.log('secondEdgeId', secondEdgeId)

        let newNode = {
            id: newNodeId,
            type: 'customEntityAssociation',
            position: {x: getEdgeCenter[1] - 320 / 2, y: getEdgeCenter[2]},
            data: {
                name: '',
                isAssociation: true,
                relatedEdgeFirstPart: firstEdgeId,
                relatedEdgeSecondPart: secondEdgeId,
                relatedNodeSource: edge.source,
                relatedNodeTarget: edge.target,
                properties: []
            }
        }

        const calculateHandlesNewNode =
            determineHandles(findNode(edge.source), findNode(edge.target), newNode);


        // Create two edges


        let newEdge1 = {
            id: firstEdgeId,
            source: edge.source,
            target: newNodeId,
            sourceHandle: edge.sourceHandle,
            targetHandle: calculateHandlesNewNode.sourceHandle,
            type: edgeType.value,
            updatable: true,
            style: null,
            label: edge.data?.sourceCardinality ?? '',
            labelBgStyle: { fill: '#F2F5F7'},
            data: {
                name: '',
                isAssociation: true,
                // Define which part of the association relationship comes from
                edgePart: 1,
                relatedEdgeId: secondEdgeId,
                relatedNodeAssociation: newNodeId,
                sourceCardinality: '',
                targetCardinality: '',
                properties: []
            }
        }

        console.log(newEdge1)

        let newEdge2 = {
            id: secondEdgeId,
            source: newNodeId,
            target: edge.target,
            targetHandle: edge.targetHandle,
            sourceHandle: calculateHandlesNewNode.targetHandle,
            type: edgeType.value,
            updatable: true,
            style: null,
            label: edge.data?.targetCardinality ?? '',
            labelBgStyle: { fill: '#F2F5F7'},
            data: {
                name: '',
                isAssociation: true,
                edgePart: 2,
                relatedEdgeId: firstEdgeId,
                relatedNodeAssociation: newNodeId,
                sourceCardinality: '',
                targetCardinality: '',
                properties: []
            }
        }

        console.log(newEdge2)

        addNodes(newNode)
        addEdges([newEdge1, newEdge2])

        // display
        isSubMenuVisible.value = true
        elementsMenu.value = false
        console.log('newNodeId')
        console.log(newNodeId)
        edgeIdSelected.value = null
        nodeIdSelected.value = newNodeId

    }
    */
    function addAssociation() {

        // Obtenir les informations de l'edge sélectionné
        let edge = flowMCD.value.findEdge(edgeIdSelected.value);

        // Calculer la position centrale de l'edge
        let getEdgeCenter = getStraightPath(edge);
        /*
        let newNodeId = getIdNode();

        // Créer le node d'association
        let newNode = {
            id: newNodeId,
            type: 'customEntityAssociation',
            position: { x: getEdgeCenter[1] - 320 / 2, y: getEdgeCenter[2] },
            data: {
                name: '',
                isAssociation: true,
                relatedEdge: edge.id,
                relatedEdgeSource: edge.source,
                relatedEdgeTarget: edge.target,
                properties: []
            }
        };

        // Ajouter le node intermédiaire
        addNodes([newNode]);

         */

        // Mettre à jour les données de l'edge existant pour inclure le node intermédiaire
        flowMCD.value.updateEdgeData(edge.id, { hasNodeAssociation: true });


        // Afficher le sous-menu pour l'association
        isSubMenuVisible.value = true;
        elementsMenu.value = false;
        edgeIdSelected.value = edge.id;
        //nodeIdSelected.value = newNodeId;
    }

    function determineHandles(nodeA, nodeB, nodeC) {
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
            if (nodeC.position.x > nodeA.position.x && nodeC.position.x < nodeB.position.x) {
                handles.sourceHandle = 's1'; // Left
                handles.targetHandle = 's4'; // Right
            } else {
                handles.sourceHandle = 's4'; // Right
                handles.targetHandle = 's1'; // Left
            }
        } else {
            // Vertical
            if (nodeC.position.y > nodeA.position.y && nodeC.position.y < nodeB.position.y) {
                handles.sourceHandle = 's2'; // Top
                handles.targetHandle = 's3'; // Bottom
            } else {
                handles.sourceHandle = 's3'; // Bottom
                handles.targetHandle = 's2'; // Top
            }
        }

        return handles;
    }


    return {
        flowMCD,
        isSubMenuVisible,
        elementsMenu,
        models,
        nodeIdSelected,
        addNode,
        addNewNode,
        getIdNode,
        getIdEdge,
        edgeType,
        edgeTypes,
        edgeIdSelected,
        addAssociation,
        setFlowInstance,
        createNewNode,
        removeNode,
        updateNode,
    }
})