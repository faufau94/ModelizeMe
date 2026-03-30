import { v4 as uuidv4 } from 'uuid';
import { DOMParser } from '@xmldom/xmldom';
import { getLayoutedElements } from '@/utils/useElk.js';

export const useConvertToFlowElements = () => {
    // ─── SQL PARSER ───
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
                const isNullable = matchColumn[0].toLowerCase().includes('null');
                const referencedTable = matchColumn[6] || null;

                columns.push({
                    id: uuidv4(),
                    propertyName: columnName,
                    typeName: columnType,
                    isPrimaryKey: isPrimaryKey,
                    isForeignKey: isForeignKey,
                    isNullable: isNullable,
                    referencedTable: referencedTable,
                });
            }

            entities.push({
                name: tableName,
                properties: columns,
                hasTimestamps: true,
                usesSoftDeletes: false,
            });
        }

        return entities;
    }

    // ─── XML PARSER (supports Merise format + legacy db-entity format) ───
    function parseXMLFile(xmlContent) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

        // Detect format: Merise (<model><entities>...) or legacy (<db-entity>...)
        const modelElement = xmlDoc.getElementsByTagName("model")[0];
        if (modelElement) {
            return parseMeriseXML(xmlDoc);
        }

        // Legacy format (db-entity / db-attribute)
        return parseLegacyXML(xmlDoc);
    }

    function parseMeriseXML(xmlDoc) {
        const entities = [];
        const relationships = [];

        // Parse entities
        const entityElements = xmlDoc.getElementsByTagName("entity");
        for (let i = 0; i < entityElements.length; i++) {
            const entity = entityElements[i];
            const entityName = entity.getAttribute("name");
            const hasTimestamps = entity.getAttribute("timestamps") !== "false";
            const usesSoftDeletes = entity.getAttribute("softDeletes") === "true";

            const properties = [];
            const propElements = entity.getElementsByTagName("property");
            for (let j = 0; j < propElements.length; j++) {
                const prop = propElements[j];
                properties.push({
                    id: uuidv4(),
                    propertyName: prop.getAttribute("name"),
                    typeName: prop.getAttribute("type") || "String",
                    isPrimaryKey: prop.getAttribute("primaryKey") === "true",
                    autoIncrement: prop.getAttribute("autoIncrement") === "true",
                    isForeignKey: prop.getAttribute("foreignKey") === "true",
                    isNullable: prop.getAttribute("nullable") === "true",
                    referencedTable: prop.getAttribute("references") || null,
                });
            }

            entities.push({
                name: entityName,
                properties,
                hasTimestamps,
                usesSoftDeletes,
            });
        }

        // Parse relationships
        const relElements = xmlDoc.getElementsByTagName("relationship");
        for (let i = 0; i < relElements.length; i++) {
            const rel = relElements[i];
            const relProps = [];
            const relPropElements = rel.getElementsByTagName("property");
            for (let j = 0; j < relPropElements.length; j++) {
                const prop = relPropElements[j];
                relProps.push({
                    id: uuidv4(),
                    propertyName: prop.getAttribute("name"),
                    typeName: prop.getAttribute("type") || "String",
                    isPrimaryKey: false,
                    autoIncrement: false,
                    isForeignKey: false,
                    isNullable: prop.getAttribute("nullable") === "true",
                });
            }

            relationships.push({
                name: rel.getAttribute("name") || "",
                source: rel.getAttribute("source"),
                target: rel.getAttribute("target"),
                sourceCardinality: rel.getAttribute("sourceCardinality") || "0,N",
                targetCardinality: rel.getAttribute("targetCardinality") || "0,N",
                hasTimestamps: rel.getAttribute("timestamps") !== "false",
                usesSoftDeletes: rel.getAttribute("softDeletes") === "true",
                isCIF: rel.getAttribute("isCIF") === "true",
                loopbackSide: rel.getAttribute("loopbackSide") || null,
                properties: relProps,
            });
        }

        // Parse ternary associations
        const ternaryAssociations = [];
        const ternaryElements = xmlDoc.getElementsByTagName("ternary-association");
        for (let i = 0; i < ternaryElements.length; i++) {
            const ternary = ternaryElements[i];
            const cifEntity = ternary.getAttribute("cif") || null;
            const participantElements = ternary.getElementsByTagName("participant");
            const participants = [];
            for (let j = 0; j < participantElements.length; j++) {
                const p = participantElements[j];
                const entityName = p.getAttribute("entity");
                participants.push({
                    entity: entityName,
                    cardinality: p.getAttribute("cardinality") || "0,N",
                    isCIF: cifEntity !== null && entityName === cifEntity,
                });
            }
            ternaryAssociations.push({
                name: ternary.getAttribute("name") || "",
                participants,
            });
        }

        return { entities, relationships, ternaryAssociations };
    }

    function parseLegacyXML(xmlDoc) {
        const entities = [];
        const dbEntities = xmlDoc.getElementsByTagName("db-entity");

        for (let i = 0; i < dbEntities.length; i++) {
            const dbEntity = dbEntities[i];
            const tableName = dbEntity.getAttribute("name");
            const attributes = dbEntity.getElementsByTagName("db-attribute");

            const columns = [];
            for (let j = 0; j < attributes.length; j++) {
                const attribute = attributes[j];
                const typeRaw = attribute.getAttribute("type") || "String";
                columns.push({
                    id: uuidv4(),
                    propertyName: attribute.getAttribute("name"),
                    typeName: typeRaw.charAt(0).toUpperCase() + typeRaw.slice(1).toLowerCase(),
                    isPrimaryKey: attribute.getAttribute("isPrimaryKey") === "true",
                    isForeignKey: attribute.getAttribute("isForeignKey") === "true",
                    isNullable: attribute.getAttribute("isNullable") === "true",
                    referencedTable: attribute.getAttribute("referencedTable"),
                });
            }

            entities.push({
                name: tableName,
                properties: columns,
                hasTimestamps: true,
                usesSoftDeletes: false,
            });
        }

        return { entities, relationships: [] };
    }

    // ─── JSON PARSER ───
    function parseJSONFile(jsonContent) {
        const data = JSON.parse(jsonContent);

        // Support direct node/edge format (exported from modelizeMe)
        if (data.nodes && data.edges) {
            return { nodes: data.nodes, edges: data.edges, isDirect: true };
        }

        // Support entity/relationship format
        const entities = (data.entities || []).map((entity) => ({
            name: entity.name,
            properties: (entity.properties || []).map((prop) => ({
                id: uuidv4(),
                propertyName: prop.propertyName || prop.name,
                typeName: prop.typeName || prop.type || "String",
                isPrimaryKey: prop.isPrimaryKey || false,
                autoIncrement: prop.autoIncrement || false,
                isForeignKey: prop.isForeignKey || false,
                isNullable: prop.isNullable || false,
                referencedTable: prop.referencedTable || prop.references || null,
            })),
            hasTimestamps: entity.hasTimestamps !== false,
            usesSoftDeletes: entity.usesSoftDeletes || false,
        }));

        const relationships = (data.relationships || []).map((rel) => ({
            name: rel.name || "",
            source: rel.source,
            target: rel.target,
            sourceCardinality: rel.sourceCardinality || "0,N",
            targetCardinality: rel.targetCardinality || "0,N",
            hasTimestamps: rel.hasTimestamps !== false,
            usesSoftDeletes: rel.usesSoftDeletes || false,
            properties: (rel.properties || []).map((prop) => ({
                id: uuidv4(),
                propertyName: prop.propertyName || prop.name,
                typeName: prop.typeName || prop.type || "String",
                isPrimaryKey: false,
                autoIncrement: false,
                isForeignKey: false,
                isNullable: prop.isNullable || false,
            })),
        }));

        return { entities, relationships, isDirect: false };
    }

    // ─── CREATE NODES FROM ENTITIES ───
    function createNodesFromEntities(entities) {
        const nodes = entities.map((entity) => {
            // Check if 'id' property exists
            const idProperty = entity.properties.find(
                (prop) => prop.propertyName.toLowerCase() === 'id' && prop.typeName.toLowerCase() === 'integer'
            );
            if (idProperty) {
                idProperty.typeName = 'Big Integer';
            } else if (!entity.properties.some((p) => p.isPrimaryKey)) {
                // Add PK only if none exists
                entity.properties.unshift({
                    id: uuidv4(),
                    propertyName: "id",
                    typeName: "Big Integer",
                    isPrimaryKey: true,
                    autoIncrement: true,
                    isForeignKey: false,
                    isNullable: false,
                });
            }

            return {
                id: `dndnode_${uuidv4()}_${uuidv4()}`,
                type: 'customEntity',
                position: { x: Math.random() * 500, y: Math.random() * 500 },
                draggable: true,
                selected: false,
                data: {
                    name: entity.name,
                    properties: entity.properties,
                    hasTimestamps: entity.hasTimestamps !== false,
                    usesSoftDeletes: entity.usesSoftDeletes || false,
                },
            };
        });

        const nodeMap = {};
        nodes.forEach((node) => {
            nodeMap[node.data.name] = node.id;
        });

        return { nodes, nodeMap };
    }

    // ─── CREATE EDGES FROM ENTITIES (FK-based, for SQL/legacy XML) ───
    function createEdgesFromEntities(entities, nodeMap) {
        const edges = [];

        entities.forEach((entity) => {
            entity.properties.forEach((property) => {
                if (property.isForeignKey && property.referencedTable) {
                    const sourceNode = nodeMap[entity.name];
                    const targetNode = nodeMap[property.referencedTable];

                    if (sourceNode && targetNode) {
                        edges.push({
                            id: `dndedge_${uuidv4()}_${uuidv4()}`,
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
                                hasTimestamps: true,
                                usesSoftDeletes: false,
                            },
                        });
                    }
                }
            });
        });

        return edges;
    }

    // ─── CREATE EDGES FROM RELATIONSHIPS (Merise format) ───
    function createEdgesFromRelationships(relationships, nodeMap) {
        const edges = [];

        for (const rel of relationships) {
            const sourceId = nodeMap[rel.source];
            const targetId = nodeMap[rel.target];

            if (sourceId && targetId) {
                edges.push({
                    id: `dndedge_${uuidv4()}_${uuidv4()}`,
                    source: sourceId,
                    target: targetId,
                    sourceHandle: 's4',
                    targetHandle: 's1',
                    type: 'customEdge',
                    updatable: true,
                    selectable: true,
                    label: '',
                    data: {
                        name: rel.name || "",
                        sourceCardinality: rel.sourceCardinality || "0,N",
                        targetCardinality: rel.targetCardinality || "0,N",
                        properties: rel.properties || [],
                        hasTimestamps: rel.hasTimestamps !== false,
                        usesSoftDeletes: rel.usesSoftDeletes || false,
                        isCIF: rel.isCIF || false,
                        loopbackSide: rel.loopbackSide || null,
                    },
                });
            }
        }

        return edges;
    }

    // ─── SAVE TO DATABASE ───
    async function saveNodesAndEdgesToDatabase(nodes, edges, modelId) {
        try {
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

    // ─── MAIN CONVERTERS ───
    async function convertSQLToFlowElements(sqlContent, modelId) {
        const entitiesFromSQL = parseSQLFile(sqlContent);
        const { nodes, nodeMap } = createNodesFromEntities(entitiesFromSQL);
        const edges = createEdgesFromEntities(entitiesFromSQL, nodeMap);
        const layouted = await getLayoutedElements(nodes, edges);

        await saveNodesAndEdgesToDatabase(layouted.nodes, layouted.edges, modelId);
        return { nodes: layouted.nodes, edges: layouted.edges };
    }

    async function convertXMLToFlowElements(xmlContent, modelId) {
        const parsed = parseXMLFile(xmlContent);
        const { nodes, nodeMap } = createNodesFromEntities(parsed.entities || parsed);
        let edges;
        if (parsed.relationships && parsed.relationships.length > 0) {
            edges = createEdgesFromRelationships(parsed.relationships, nodeMap);
        } else {
            edges = createEdgesFromEntities(
                Array.isArray(parsed.entities) ? parsed.entities : (Array.isArray(parsed) ? parsed : []),
                nodeMap
            );
        }

        // Create ternary entity nodes and their connecting edges
        const ternaryNodes = [];
        const ternaryEdges = [];
        if (parsed.ternaryAssociations && parsed.ternaryAssociations.length > 0) {
            for (const ta of parsed.ternaryAssociations) {
                const ternaryId = `dndnode_${uuidv4()}_${uuidv4()}`;
                ternaryNodes.push({
                    id: ternaryId,
                    type: 'ternaryEntity',
                    position: { x: Math.random() * 600, y: Math.random() * 400 },
                    draggable: true,
                    selected: false,
                    data: {
                        name: ta.name,
                        hasTimestamps: false,
                        usesSoftDeletes: false,
                        properties: [],
                    },
                });
                for (const participant of ta.participants) {
                    const entityId = nodeMap[participant.entity];
                    if (entityId) {
                        ternaryEdges.push({
                            id: `dndedge_${uuidv4()}_${uuidv4()}`,
                            source: entityId,
                            target: ternaryId,
                            sourceHandle: 's4',
                            targetHandle: null,
                            type: 'customEdge',
                            updatable: true,
                            selectable: true,
                            label: '',
                            data: {
                                name: '',
                                sourceCardinality: participant.cardinality,
                                targetCardinality: '1,1',
                                properties: [],
                                hasTimestamps: false,
                                usesSoftDeletes: false,
                                isCIF: participant.isCIF || false,
                                loopbackSide: null,
                            },
                        });
                    }
                }
            }
        }

        const allNodes = [...nodes, ...ternaryNodes];
        const allEdges = [...edges, ...ternaryEdges];
        const layouted = await getLayoutedElements(allNodes, allEdges);
        await saveNodesAndEdgesToDatabase(layouted.nodes, layouted.edges, modelId);
        return { nodes: layouted.nodes, edges: layouted.edges };
    }

    async function convertJSONToFlowElements(jsonContent, modelId) {
        const parsed = parseJSONFile(jsonContent);

        // Direct node/edge format (re-import from modelizeMe export)
        if (parsed.isDirect) {
            // Re-assign IDs to avoid conflicts with existing nodes
            const idRemap = new Map();
            const nodes = parsed.nodes.map((node) => {
                const newId = `dndnode_${uuidv4()}_${uuidv4()}`;
                idRemap.set(node.id, newId);
                return { ...node, id: newId, selected: false };
            });
            const edges = parsed.edges.map((edge) => ({
                ...edge,
                id: `dndedge_${uuidv4()}_${uuidv4()}`,
                source: idRemap.get(edge.source) || edge.source,
                target: idRemap.get(edge.target) || edge.target,
                selected: false,
            }));
            const layouted = await getLayoutedElements(nodes, edges);
            await saveNodesAndEdgesToDatabase(layouted.nodes, layouted.edges, modelId);
            return { nodes: layouted.nodes, edges: layouted.edges };
        }

        const { nodes, nodeMap } = createNodesFromEntities(parsed.entities);
        let edges;
        if (parsed.relationships && parsed.relationships.length > 0) {
            edges = createEdgesFromRelationships(parsed.relationships, nodeMap);
        } else {
            edges = createEdgesFromEntities(parsed.entities, nodeMap);
        }

        const layouted = await getLayoutedElements(nodes, edges);

        await saveNodesAndEdgesToDatabase(layouted.nodes, layouted.edges, modelId);
        return { nodes: layouted.nodes, edges: layouted.edges };
    }

    return {
        convertSQLToFlowElements,
        convertXMLToFlowElements,
        convertJSONToFlowElements,
    };
};
