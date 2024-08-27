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

    function createNewEdge(params) {
        let newEdgeId = getIdEdge();
        return {
            id: newEdgeId,
            source: params.source,
            target: params.target,
            sourceHandle: params.sourceHandle,
            targetHandle: params.targetHandle,
            type: 'customEdge',
            updatable: true,
            selectable: true,
            style: null,
            label: '',
            data: {
                name: '',
                sourceCardinality: '',
                targetCardinality: '',
                properties: []
            }
        }
    }

    async function updateEdge(idModel, idEdge) {
        const edge = flowMCD.value.findEdge(idEdge)
        console.log(edge)
        edge.selected = false
        await $fetch(`/api/models/update`, {
            method: 'PUT',
            query: { id: idModel },
            body: {
                edge: edge,
                type: 'edge',
                action: 'updateEdge'
            }
        });
    }

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
        createNewEdge,
        removeNode,
        updateNode,
        updateEdge,
    }
})