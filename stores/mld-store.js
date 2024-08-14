import {computed, ref} from "vue";
import {defineStore} from "pinia";
import {getStraightPath, useVueFlow} from "@vue-flow/core";

export const useMLDStore = defineStore('flow-mld', () => {

    const flowMLD = useVueFlow('flow-mld')

    const generateMLD = () => {
        const useMCDStore = useMCDStore()


        let idNodeMLD = 0
        let idEdgeMLD = 0

        const getIdNodeMLD = () => {
            return `dndnode_MLD_${idNodeMLD++}`
        }
        const getIdEdgeMLD = () => {
            return `dndedge_MLD_${idEdgeMLD++}`
        }



        // 1. vider flowMLD
        // 2. faire un boucle des edge de useMCDStore.flowMCD
        // 3. pour chaque edge, vérifier si le cardinalité est x,1 - x,n et ajouter la clé étrangère au noeud x,1
        // 4. si cardinalité est x,1 - x,1, ajouter la clé étrangère au noeud x,1
        // 5. si cardinalité est x,n - x,n, ajouter un noeud central avec les clés primaires des deux noeuds
        // 6. ajouter les noeuds et les edges dans flowMLD

        flowMLD.removeNodes(flowMLD.nodes.value, true)

        useMCDStore.flowMCD.getEdges.value.forEach(edge => {
            let edgeDatas = JSON.parse(JSON.stringify(edge.data))

            // First case : x,1 - x,n and second case : x,1 - x,1
            let getSecondElementSource = edgeDatas.data.sourceCardinality.split(',')[1]
            let getSecondElementTarget = edgeDatas.data.targetCardinality.split(',')[1]

            let extractedSecondElement = [getSecondElementSource, getSecondElementTarget]

            let getIdFirstNode = '';
            let getIdSecondNode = '';

            if ((extractedSecondElement.includes('1') && extractedSecondElement.includes('n')) ||
                (extractedSecondElement[0] === '1' && extractedSecondElement[1] === '1')) {

                if (extractedSecondElement.includes('1') && extractedSecondElement.includes('n')) {
                    // get node (source or target) which have 1,1 to add foreign key
                    if (edgeDatas.data.sourceCardinality.split(',')[1] === '1') {
                        getIdFirstNode = edge.source
                        getIdSecondNode = edge.target
                    } else {
                        getIdFirstNode = edge.target
                        getIdSecondNode = edge.source
                    }

                } else if (extractedSecondElement[0] === '1' && extractedSecondElement[1] === '1') {
                    // get any of these nodes (source or target) which have 1,1 to add foreign key
                    getIdFirstNode = edge.source
                    getIdSecondNode = edge.target
                }


                // check is node already exists in MLD
                let firstNode = JSON.parse(JSON.stringify(flowMLD.findNode(getIdFirstNode) === undefined ?
                    useMCDStore.flowMCD.findNode(getIdFirstNode) :
                    flowMLD.findNode(getIdFirstNode)))

                let secondNode = JSON.parse(JSON.stringify(flowMLD.findNode(getIdSecondNode) === undefined ?
                    useMCDStore.flowMCD.findNode(getIdSecondNode) :
                    flowMLD.findNode(getIdSecondNode)))

                // add foreign key
                firstNode.data.properties = [
                    ...firstNode.data.properties,
                    {
                        propertyName: `${secondNode.data.name}`,
                        typeName: 'Foreign Key'
                    },
                ]


                //firstNode.template = MyCustomEntityMLD
                //secondNode.template = MyCustomEntityMLD


                // Remove empty property and type name
                firstNode.data.properties = firstNode.data.properties.filter(el => el.propertyName !== "" && el.typeName !== "")
                secondNode.data.properties = secondNode.data.properties.filter(el => el.propertyName !== "" && el.typeName !== "")

                let newNodesList = [
                    ...flowMLD.nodes.value,
                    firstNode,
                    secondNode
                ]

                flowMLD.setNodes(newNodesList)

            } else if (extractedSecondElement[0] === 'n' && extractedSecondElement[1] === 'n') {
                //Third case : x,n - x,n

                // Get the source and target nodes
                getIdFirstNode = edge.source
                getIdSecondNode = edge.target

                let firstNode = JSON.parse(JSON.stringify(useMCDStore.flowMCD.findNode(getIdFirstNode)))
                let secondNode = JSON.parse(JSON.stringify(useMCDStore.flowMCD.findNode(getIdSecondNode)))


                // get center edge with the two nodes (for adding the central node)
                let centerEdge = computed(() =>
                    getStraightPath({
                        sourceX: edge.sourceNode.x,
                        sourceY: edge.sourceNode.y,
                        targetX: edge.targetNode.x,
                        targetY: edge.targetNode.y,
                    }),
                )
                //let position = flowMLD.project({x: centerEdge.value[0], y: centerEdge.value[1]})

                // create new node with primaries keys
                /*
                let newNode = {
                  id: `node_${genRand(10)}`,
                  type,
                  position,
                  template: markRaw(MyCustomEntityMLD),
                  x: position.x,
                  y: position.y,
                  data: {
                    name: `${firstNode.data.name}_${secondNode.data.name}`,
                    properties: [
                      // first key attribute (primary key)
                      firstNode.data.properties[0],
                      secondNode.data.properties[0],
                      ...edgeDatas.properties
                    ]
                  }
                }
                 */

                let newNode = {
                    id: getIdNodeMLD(),
                    type: 'customEntityAssociation',
                    position: { x: centerEdge[1] - 320 / 2, y: centerEdge[2] },
                    data: {
                        name: `${firstNode.data.name}_${secondNode.data.name}`,
                        isAssociation: true,
                        relatedEdge: edge.id,
                        relatedEdgeSource: edge.source,
                        relatedEdgeTarget: edge.target,
                        properties: [
                            // first key attribute (primary key)
                            firstNode.data.properties[0],
                            secondNode.data.properties[0],
                            ...edgeDatas.data.properties
                        ]
                    }
                };



                //firstNode.template = MyCustomEntityMLD
                //secondNode.template = MyCustomEntityMLD


                // Remove empty property and type name
                firstNode.data.properties = firstNode.data.properties.filter(el => el.propertyName !== "" && el.typeName !== "")
                secondNode.data.properties = secondNode.data.properties.filter(el => el.propertyName !== "" && el.typeName !== "")
                newNode.data.properties = newNode.data.properties.filter(el => el.propertyName !== "" && el.typeName !== "")

                let newNodesList = [
                    ...flowMLD.nodes.value,
                    firstNode,
                    secondNode,
                    newNode,
                ]

                flowMLD.setNodes(newNodesList)

                // create two edge : one between firstnode and newNode, the second between newnode and secondnode

                const calculateHandlesNewNode =
                    determineHandles(useMCDStore.flowMCD.findNode(edge.source), useMCDStore.flowMCD.findNode(edge.target), newNode);


                let newEdge1 = {
                    id: getIdEdgeMLD(),
                    source: edge.source,
                    target: newNode.id,
                    sourceHandle: edge.sourceHandle,
                    targetHandle: calculateHandlesNewNode.sourceHandle,
                    type: edgeType.value,
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
                    source: newNode.id,
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
                        isFromAssociation: true,
                        isAssociation: true,
                        edgePart: 2,
                        sourceCardinality: '',
                        targetCardinality: '',
                        properties: []
                    }
                }
                flowMLD.addEdges([newEdge1, newEdge2])



            }

            // edge part
            if (!(extractedSecondElement[0] === 'n' && extractedSecondElement[1] === 'n')) {
                // Add edges node from mcd into mld
                /*
                let edgeCopy = JSON.parse(JSON.stringify(edge))
                delete edgeCopy.template

                edgeCopy = {
                  ...edgeCopy,
                  label: edgeCopy.data.name
                }
                let newEdgesList = [
                  ...flowMLD.edges.value,
                  edgeCopy
                ]

                 */
                let edgeCopy = JSON.parse(JSON.stringify(edge))
                edgeCopy.data.sourceCardinality = ''
                edgeCopy.data.targetCardinality = ''
                flowMLD.setEdges(edgeCopy)
            }


        })

    }


    return {
        flowMLD,
        generateMLD
    }
})