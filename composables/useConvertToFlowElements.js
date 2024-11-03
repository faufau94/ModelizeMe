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
                    isForeignKey: false, // XML n'a pas de FOREIGN KEY explicite ici
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
        return entities.map((entity) => {
            return {
                id: `dndnode_${uuidv4()}`,
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
    }

    // Fonction pour créer les arêtes Vue-Flow à partir des entités
    function createEdgesFromEntities(entities) {
        const edges = [];

        entities.forEach((entity) => {
            entity.properties.forEach((property) => {
                if (property.isForeignKey && property.referencedTable) {
                    const sourceNode = entity.name;
                    const targetNode = property.referencedTable;

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
                            sourceCardinality: '1', // Exemple de cardinalité
                            targetCardinality: 'N', // Exemple de cardinalité
                            properties: [],
                        },
                    });
                }
            });
        });

        return edges;
    }

    // Fonction principale pour convertir SQL en nœuds et arêtes pour Vue-Flow
    function convertSQLToFlowElements(sqlContent) {
        const entitiesFromSQL = parseSQLFile(sqlContent);
        const nodes = createNodesFromEntities(entitiesFromSQL);
        const edges = createEdgesFromEntities(entitiesFromSQL);

        return { nodes, edges };
    }

    // Fonction principale pour convertir XML en nœuds et arêtes pour Vue-Flow
    function convertXMLToFlowElements(xmlContent) {
        const entitiesFromXML = parseXMLFile(xmlContent);
        const nodes = createNodesFromEntities(entitiesFromXML);
        const edges = createEdgesFromEntities(entitiesFromXML);

        return { nodes, edges };
    }

    return {
        convertSQLToFlowElements,
        convertXMLToFlowElements,
    };
};
