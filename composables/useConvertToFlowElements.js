import { v4 as uuidv4 } from 'uuid';
import { DOMParser } from '@xmldom/xmldom';
import { getLayoutedElements } from '@/utils/useElk.js';

export const useConvertToFlowElements = () => {
    // ─── SQL PARSER ───

    // Map raw SQL types to the app's internal type system
    function mapSQLType(rawType) {
        const t = rawType.toLowerCase();
        if (['bigint', 'bigserial'].includes(t)) return 'Big Integer';
        if (['int', 'integer', 'smallint', 'tinyint', 'mediumint', 'serial'].includes(t)) return 'Integer';
        if (['decimal', 'numeric', 'float', 'double', 'real', 'money'].includes(t)) return 'Decimal';
        if (['text', 'mediumtext', 'longtext', 'clob'].includes(t)) return 'Text';
        if (['date'].includes(t)) return 'Date';
        if (['datetime', 'timestamp', 'timestamptz'].includes(t)) return 'DateTime';
        if (['boolean', 'bool', 'bit'].includes(t)) return 'Boolean';
        // varchar, char, enum, set, blob, etc. → String
        return 'String';
    }

    function parseSQLFile(sqlContent) {
        const entities = [];

        // Strip everything after the last CREATE TABLE block (INSERT INTO, etc.)
        const stripped = sqlContent.replace(/\bINSERT\s+INTO\b[\s\S]*$/i, '');

        const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(([\s\S]+?)\)\s*;/gi;

        let matchTable;
        while ((matchTable = tableRegex.exec(stripped)) !== null) {
            const tableName = matchTable[1];
            const body = matchTable[2];
            const columns = [];

            // Split body into individual lines/clauses
            const lines = body.split('\n').map(l => l.trim()).filter(Boolean);

            // Collect constraint info first
            const pkColumns = new Set();
            const fkMap = {}; // columnName → referencedTable
            const compositePKs = [];

            for (const line of lines) {
                // Standalone PRIMARY KEY constraint
                const pkMatch = line.match(/^\s*PRIMARY\s+KEY\s*\(([^)]+)\)/i);
                if (pkMatch) {
                    const cols = pkMatch[1].split(',').map(c => c.trim().replace(/[`"']/g, ''));
                    cols.forEach(c => pkColumns.add(c));
                    if (cols.length > 1) compositePKs.push(...cols);
                    continue;
                }

                // Standalone FOREIGN KEY constraint
                const fkMatch = line.match(/^\s*(?:CONSTRAINT\s+[`"']?\w+[`"']?\s+)?FOREIGN\s+KEY\s*\([`"']?(\w+)[`"']?\)\s*REFERENCES\s+[`"']?(\w+)[`"']?/i);
                if (fkMatch) {
                    fkMap[fkMatch[1]] = fkMatch[2];
                    continue;
                }

                // Skip KEY, INDEX, UNIQUE, CHECK constraints
                if (/^\s*(UNIQUE|KEY|INDEX|CHECK|CONSTRAINT)\b/i.test(line)) continue;

                // Parse column definition
                const colMatch = line.match(/^[`"']?(\w+)[`"']?\s+(\w+)(?:\([^)]*\))?(.*)$/);
                if (!colMatch) continue;

                const columnName = colMatch[1];
                const rawType = colMatch[2];
                const rest = colMatch[3] || '';

                // Skip SQL keywords mistakenly captured as column names
                if (/^(PRIMARY|FOREIGN|KEY|INDEX|UNIQUE|CHECK|CONSTRAINT)$/i.test(columnName)) continue;

                // Detect NOT NULL vs NULL (default nullable unless NOT NULL)
                const hasNotNull = /\bNOT\s+NULL\b/i.test(rest);
                const hasDefault = /\bDEFAULT\b/i.test(rest);
                const isNullable = !hasNotNull || /\bDEFAULT\s+NULL\b/i.test(rest);

                // Detect AUTO_INCREMENT / SERIAL
                const autoIncrement = /\bAUTO_INCREMENT\b/i.test(rest) || /\b(BIG)?SERIAL\b/i.test(rawType);

                // Detect inline PRIMARY KEY
                const inlinePK = /\bPRIMARY\s+KEY\b/i.test(rest);
                if (inlinePK) pkColumns.add(columnName);

                // Detect inline REFERENCES
                const inlineRef = rest.match(/\bREFERENCES\s+[`"']?(\w+)[`"']?/i);
                if (inlineRef) fkMap[columnName] = inlineRef[1];

                columns.push({
                    id: uuidv4(),
                    propertyName: columnName,
                    typeName: mapSQLType(rawType),
                    isPrimaryKey: inlinePK,
                    autoIncrement,
                    isForeignKey: false,
                    isNullable,
                    referencedTable: null,
                });
            }

            // Apply constraint info to columns
            for (const col of columns) {
                if (pkColumns.has(col.propertyName)) {
                    col.isPrimaryKey = true;
                    col.isNullable = false;
                }
                if (fkMap[col.propertyName]) {
                    col.isForeignKey = true;
                    col.referencedTable = fkMap[col.propertyName];
                }
            }

            entities.push({
                name: tableName,
                properties: columns,
                hasTimestamps: false,
                usesSoftDeletes: false,
                _compositePK: compositePKs.length > 1 ? compositePKs : null,
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
        // Detect junction tables to exclude them from nodes
        const junctionTableNames = new Set();
        for (const entity of entities) {
            if (!entity._compositePK || entity._compositePK.length < 2) continue;
            const fkCols = entity.properties.filter(p => p.isForeignKey).map(p => p.propertyName);
            const allPKsAreFK = entity._compositePK.every(pk => fkCols.includes(pk));
            if (allPKsAreFK) junctionTableNames.add(entity.name);
        }

        const nodes = entities
            .filter(entity => !junctionTableNames.has(entity.name))
            .map((entity) => {
            // Remove FK columns — in MCD, relationships are edges, not columns
            const nonFKProperties = entity.properties.filter(p => !p.isForeignKey);

            // Check if 'id' property exists
            const idProperty = nonFKProperties.find(
                (prop) => prop.propertyName.toLowerCase() === 'id' && prop.typeName.toLowerCase() === 'integer'
            );
            if (idProperty) {
                idProperty.typeName = 'Big Integer';
            } else if (!nonFKProperties.some((p) => p.isPrimaryKey)) {
                // Add PK only if none exists
                nonFKProperties.unshift({
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
                    properties: nonFKProperties,
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

        // Detect junction tables: tables whose PK is a composite of FKs only
        const junctionTables = new Set();
        for (const entity of entities) {
            if (!entity._compositePK || entity._compositePK.length < 2) continue;
            const fkCols = entity.properties.filter(p => p.isForeignKey).map(p => p.propertyName);
            const allPKsAreFK = entity._compositePK.every(pk => fkCols.includes(pk));
            if (allPKsAreFK) junctionTables.add(entity.name);
        }

        for (const entity of entities) {
            if (junctionTables.has(entity.name)) {
                // Junction table → create N:N edge between the referenced tables
                const fks = entity.properties.filter(p => p.isForeignKey && p.referencedTable);
                if (fks.length >= 2) {
                    const sourceNode = nodeMap[fks[0].referencedTable];
                    const targetNode = nodeMap[fks[1].referencedTable];
                    if (sourceNode && targetNode) {
                        // Non-FK, non-PK properties become edge properties
                        const edgeProps = entity.properties
                            .filter(p => !p.isForeignKey && !p.isPrimaryKey)
                            .map(p => ({
                                id: uuidv4(),
                                propertyName: p.propertyName,
                                typeName: p.typeName,
                                isPrimaryKey: false,
                                autoIncrement: false,
                                isForeignKey: false,
                                isNullable: p.isNullable,
                            }));

                        const isReflexive = fks[0].referencedTable === fks[1].referencedTable;

                        edges.push({
                            id: `dndedge_${uuidv4()}_${uuidv4()}`,
                            source: sourceNode,
                            target: targetNode,
                            sourceHandle: 's4',
                            targetHandle: 's1',
                            type: 'customEdge',
                            updatable: true,
                            selectable: true,
                            label: '',
                            data: {
                                name: entity.name,
                                sourceCardinality: '0,N',
                                targetCardinality: '0,N',
                                properties: edgeProps,
                                hasTimestamps: false,
                                usesSoftDeletes: false,
                                isCIF: false,
                                loopbackSide: isReflexive ? 'right' : null,
                            },
                        });
                    }
                }
                continue;
            }

            // Regular table → create 1:N edges from FKs
            for (const property of entity.properties) {
                if (!property.isForeignKey || !property.referencedTable) continue;

                const sourceNode = nodeMap[property.referencedTable];
                const targetNode = nodeMap[entity.name];
                if (!sourceNode || !targetNode) continue;

                const isReflexive = property.referencedTable === entity.name;

                edges.push({
                    id: `dndedge_${uuidv4()}_${uuidv4()}`,
                    source: sourceNode,
                    target: targetNode,
                    sourceHandle: isReflexive ? 's2' : 's4',
                    targetHandle: isReflexive ? 's3' : 's1',
                    type: 'customEdge',
                    updatable: true,
                    selectable: true,
                    label: '',
                    data: {
                        name: property.propertyName.replace(/_?id$/i, '').replace(/([A-Z])/g, ' $1').trim(),
                        sourceCardinality: property.isNullable ? '0,1' : '1,1',
                        targetCardinality: '0,N',
                        properties: [],
                        hasTimestamps: false,
                        usesSoftDeletes: false,
                        isCIF: false,
                        loopbackSide: isReflexive ? 'right' : null,
                    },
                });
            }
        }

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
                                targetCardinality: participant.cardinality,
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
