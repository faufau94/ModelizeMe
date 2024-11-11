import { v4 as uuidv4 } from 'uuid';
import { DOMParser } from '@xmldom/xmldom'; // Import nécessaire pour DOMParser en Nuxt 3

export const useConvertToFlowElements = () => {
    // Fonction pour parser le contenu du fichier SQL
    function parseSQLFile(sqlContent) {
        const entities = [];
        const tableRegex = /CREATE TABLE `?(\w+)`? \(([\s\S]+?)\);/g;
        const columnRegex = /`?(\w+)`?\s+(\w+)(\((\d+)\))?[^,]*?(PRIMARY KEY|FOREIGN KEY|REFERENCES `?(\w+)`?)?/g;

        let matchTable;
        while ((matchTable = tableRegex.exec(sqlContent)) !== null) {
            const tableName = matchTable[1];
            const columns = [];

            let matchColumn;
            while ((matchColumn = columnRegex.exec(matchTable[2])) !== null) {
                const columnName = matchColumn[1];
                const columnType = matchColumn[2];
                const isPrimaryKey = matchColumn[5] === 'PRIMARY KEY';
                const isForeignKey = matchColumn[5] && matchColumn[5].startsWith('FOREIGN KEY');
                const referencedTable = matchColumn[6] || null;

                columns.push({
                    propertyName: columnName,
                    typeName: columnType,
                    isPrimaryKey: isPrimaryKey,
                    isForeignKey: isForeignKey,
                    referencedTable: referencedTable,
                });
            }

            entities.push({
                name: tableName,
                properties: columns,
            });
        }

        return entities;
    }

    // Fonction pour parser le contenu du fichier XML
    function parseXMLFile(xmlContent) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

        const entities = [];
        const dbEntities = xmlDoc.getElementsByTagName("db-entity");

        for (let i = 0; i < dbEntities.length; i++) {
            const dbEntity = dbEntities[i];
            const tableName = dbEntity.getAttribute("name");
            const attributes = dbEntity.getElementsByTagName("db-attribute");

            const columns = [];
            for (let j = 0; j < attributes.length; j++) {
                const attribute = attributes[j];
                columns.push({
                    propertyName: attribute.getAttribute("name"),
                    typeName: attribute.getAttribute("type"),
                    isPrimaryKey: attribute.getAttribute("isPrimaryKey") === "true",
                    isForeignKey: attribute.getAttribute("isForeignKey") === "true",
                    referencedTable: attribute.getAttribute("referencedTable"),
                });
            }

            entities.push({
                name: tableName,
                properties: columns,
            });
        }

        return entities;
    }

    // Fonction pour créer les nœuds Vue-Flow à partir des entités
    function createNodesFromEntities(entities) {
        const nodes = entities.map((entity) => {
            return {
                id: `dndnode_${uuidv4()}`, // Générer un ID unique pour chaque nœud qui commence par 'dndnode_'
                type: 'customEntity',
                position: { x: Math.random() * 500, y: Math.random() * 500 },
                draggable: true,
                selected: false,
                data: {
                    name: entity.name,
                    properties: entity.properties,
                },
            };
        });

        // Créer un dictionnaire pour trouver les ID des nœuds par leur nom
        const nodeMap = {};
        nodes.forEach((node) => {
            nodeMap[node.data.name] = node.id;
        });

        return { nodes, nodeMap };
    }

    // Fonction pour créer les arêtes Vue-Flow à partir des entités
    function createEdgesFromEntities(entities, nodeMap) {
        const edges = [];

        entities.forEach((entity) => {
            entity.properties.forEach((property) => {
                if (property.isForeignKey && property.referencedTable) {
                    const sourceNode = nodeMap[entity.name];
                    const targetNode = nodeMap[property.referencedTable];

                    // Vérifier que les nœuds source et cible existent avant de créer l'arête
                    if (sourceNode && targetNode) {
                        edges.push({
                            id: `dndedge_${uuidv4()}`,
                            source: sourceNode,
                            target: targetNode,
                            sourceHandle: 's1',
                            targetHandle: 's4',
                            type: 'customEdge',
                            updatable: true,
                            selectable: true,
                            label: '',
                            data: {
                                name: `${entity.name} -> ${property.referencedTable}`,
                                sourceCardinality: '1',
                                targetCardinality: 'N',
                                properties: [],
                            },
                        });
                    }
                }
            });
        });

        return edges;
    }

    // Fonction pour enregistrer les nœuds et arêtes en base de données via l'API import
    async function saveNodesAndEdgesToDatabase(nodes, edges, modelId) {
        try {
            console.log("Enregistrement des nœuds et arêtes :", nodes, edges, modelId);
            await $fetch('/api/models/import', {
                method: 'PUT',
                body: {
                    modelId: modelId,
                    nodes: nodes,
                    edges: edges,
                },
            });
        } catch (error) {
            console.error("Erreur lors de l'enregistrement des nœuds et arêtes :", error);
        }
    }

    // Fonction principale pour convertir SQL en nœuds et arêtes pour Vue-Flow et les enregistrer
    async function convertSQLToFlowElements(sqlContent, modelId) {
        const entitiesFromSQL = parseSQLFile(sqlContent);
        const { nodes, nodeMap } = createNodesFromEntities(entitiesFromSQL);
        const edges = createEdgesFromEntities(entitiesFromSQL, nodeMap);

        await saveNodesAndEdgesToDatabase(nodes, edges, modelId);

        return { nodes, edges };
    }

    // Fonction principale pour convertir XML en nœuds et arêtes pour Vue-Flow et les enregistrer
    async function convertXMLToFlowElements(xmlContent, modelId) {
        const entitiesFromXML = parseXMLFile(xmlContent);
        const { nodes, nodeMap } = createNodesFromEntities(entitiesFromXML);
        const edges = createEdgesFromEntities(entitiesFromXML, nodeMap);

        await saveNodesAndEdgesToDatabase(nodes, edges, modelId);

        console.log("Nodes and edges saved to database:", nodes, edges);
        return { nodes, edges };
    }

    return {
        convertSQLToFlowElements,
        convertXMLToFlowElements,
    };
};
