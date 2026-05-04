import { v4 as uuidv4 } from 'uuid'
import { getLayoutedElements } from '@/utils/useElk.js'

export const useImport = () => {
  // Regex to strip SQL identifier quotes: backtick, double-quote, single-quote, brackets
  // Built via RegExp constructor to avoid backticks in source that confuse Vite's parser
  const STRIP_QUOTES_RE = new RegExp('[\x60"\'\\[\\]]', 'g')

  /**
   * Strip SQL identifier quoting characters from a string.
   */
  function stripQuotes(s) {
    return s.trim().replace(STRIP_QUOTES_RE, '')
  }

  // ─── SQL TYPE MAPPING ───────────────────────────────────────────────────

  /**
   * Map raw SQL types to the app's internal type system.
   * Handles both bare type names and parameterised ones (e.g. VARCHAR(255)).
   */
  function mapSQLType(rawType) {
    const t = rawType.toLowerCase().replace(/\(.*\)/, '').trim()
    if (['bigint', 'bigserial'].includes(t)) return 'Big Integer'
    if (['int', 'integer', 'smallint', 'tinyint', 'mediumint', 'serial'].includes(t)) return 'Integer'
    if (['decimal', 'numeric', 'float', 'double', 'real', 'money'].includes(t)) return 'Decimal'
    if (['text', 'mediumtext', 'longtext', 'clob'].includes(t)) return 'Text'
    if (['date'].includes(t)) return 'Date'
    if (['datetime', 'timestamp', 'timestamptz', 'time', 'timetz'].includes(t)) return 'Timestamp'
    if (['boolean', 'bool', 'bit'].includes(t)) return 'Boolean'
    if (['json', 'jsonb'].includes(t)) return 'Text'
    if (['uuid'].includes(t)) return 'String'
    // varchar, char, enum, set, blob, etc. → String
    return 'String'
  }

  // ─── SQL PARSER ─────────────────────────────────────────────────────────

  /**
   * Parse a full SQL DDL script and extract table definitions with columns,
   * primary keys, foreign keys, and composite PK info.
   * Supports MySQL, PostgreSQL, SQLite, SQL Server DDL syntax.
   */
  function parseSQLFile(sqlContent) {
    const entities = []

    // Normalise: remove comments, strip INSERT/ALTER blocks for cleanliness
    let cleaned = sqlContent
      .replace(/--[^\n]*/g, '')           // single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')   // block comments
      .replace(/\bINSERT\s+INTO\b[\s\S]*?;/gi, '') // INSERT statements

    // Identifier quote chars for regex patterns (avoids literal backticks in source)
    const Q = "[\\x60\"'\\[]?"    // optional opening quote
    const QC = "[\\x60\"'\\]]?"   // optional closing quote
    const QS = "[\\x60\"']?"      // optional quote (no brackets)

    const tableRegex = new RegExp(
      'CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?' + Q + '(\\w+)' + QC + '\\s*\\(', 'gi',
    )

    let matchTable
    while ((matchTable = tableRegex.exec(cleaned)) !== null) {
      const tableName = matchTable[1]

      // Extract body by matching balanced parentheses from the opening '('
      let depth = 1
      let bodyStart = tableRegex.lastIndex
      let i = bodyStart
      while (i < cleaned.length && depth > 0) {
        if (cleaned[i] === '(') depth++
        else if (cleaned[i] === ')') depth--
        i++
      }
      if (depth !== 0) continue // unbalanced, skip
      const body = cleaned.slice(bodyStart, i - 1)
      const columns = []

      const lines = body.split('\n').map(l => l.trim()).filter(Boolean)

      // Constraint collectors
      const pkColumns = new Set()
      const fkMap = {}              // columnName → { table, column }
      const uniqueColumns = new Set()
      const compositePKs = []

      for (const line of lines) {
        // ── PRIMARY KEY constraint ──
        const pkMatch = line.match(new RegExp('^\\s*(?:CONSTRAINT\\s+' + QS + '\\w+' + QS + '\\s+)?PRIMARY\\s+KEY\\s*\\(([^)]+)\\)', 'i'))
        if (pkMatch) {
          const cols = pkMatch[1].split(',').map(c => stripQuotes(c))
          cols.forEach(c => pkColumns.add(c))
          if (cols.length > 1) compositePKs.push(...cols)
          continue
        }

        // ── FOREIGN KEY constraint (single or composite) ──
        const fkMatch = line.match(
          new RegExp('^\\s*(?:CONSTRAINT\\s+' + QS + '\\w+' + QS + '\\s+)?FOREIGN\\s+KEY\\s*\\(([^)]+)\\)\\s*REFERENCES\\s+' + Q + '(\\w+)' + QC + '\\s*\\(([^)]+)\\)', 'i'),
        )
        if (fkMatch) {
          const fkCols = fkMatch[1].split(',').map(c => stripQuotes(c))
          const refTable = fkMatch[2]
          const refCols = fkMatch[3].split(',').map(c => stripQuotes(c))
          fkCols.forEach((col, idx) => {
            fkMap[col] = { table: refTable, column: refCols[idx] || refCols[0] }
          })
          continue
        }

        // ── UNIQUE constraint ──
        const uniqueMatch = line.match(new RegExp('^\\s*(?:CONSTRAINT\\s+' + QS + '\\w+' + QS + '\\s+)?UNIQUE\\s*\\(([^)]+)\\)', 'i'))
        if (uniqueMatch) {
          uniqueMatch[1].split(',').map(c => stripQuotes(c)).forEach(c => uniqueColumns.add(c))
          continue
        }

        // ── Skip non-column lines ──
        if (/^\s*(KEY|INDEX|CHECK|CONSTRAINT|UNIQUE)\b/i.test(line)) continue

        // ── Column definition ──
        const colMatch = line.match(new RegExp('^' + Q + '(\\w+)' + QC + '\\s+(\\w+(?:\\([^)]*\\))?)(.*)$'))
        if (!colMatch) continue

        const columnName = colMatch[1]
        const rawType = colMatch[2]
        const rest = colMatch[3] || ''

        // Skip SQL keywords mistakenly captured as column names
        if (/^(PRIMARY|FOREIGN|KEY|INDEX|UNIQUE|CHECK|CONSTRAINT)$/i.test(columnName)) continue

        const hasNotNull = /\bNOT\s+NULL\b/i.test(rest)
        const isNullable = !hasNotNull
        const autoIncrement = /\bAUTO_INCREMENT\b/i.test(rest)
          || /\bIDENTITY\b/i.test(rest)
          || /\b(BIG)?SERIAL\b/i.test(rawType)

        // Inline PRIMARY KEY
        const inlinePK = /\bPRIMARY\s+KEY\b/i.test(rest)
        if (inlinePK) pkColumns.add(columnName)

        // Inline UNIQUE
        if (/\bUNIQUE\b/i.test(rest)) uniqueColumns.add(columnName)

        // Inline REFERENCES
        const inlineRef = rest.match(new RegExp('\\bREFERENCES\\s+' + Q + '(\\w+)' + QC + '\\s*\\(' + Q + '(\\w+)' + QC + '\\)', 'i'))
        if (inlineRef) fkMap[columnName] = { table: inlineRef[1], column: inlineRef[2] }

        columns.push({
          id: uuidv4(),
          propertyName: columnName,
          typeName: mapSQLType(rawType),
          isPrimaryKey: inlinePK,
          autoIncrement,
          isForeignKey: false,
          isNullable,
          isUnique: false,
          referencedTable: null,
        })
      }

      // Apply collected constraints to columns
      for (const col of columns) {
        if (pkColumns.has(col.propertyName)) {
          col.isPrimaryKey = true
          col.isNullable = false
        }
        if (fkMap[col.propertyName]) {
          col.isForeignKey = true
          col.referencedTable = fkMap[col.propertyName].table
        }
        if (uniqueColumns.has(col.propertyName)) {
          col.isUnique = true
        }
      }

      // Parse ALTER TABLE … ADD FOREIGN KEY for this table
      const q = '[\\x60"\'\\[]?'   // optional opening quote (backtick, ", ', [)
      const qc = '[\\x60"\'\\]]?'  // optional closing quote
      const alterFKRegex = new RegExp(
        'ALTER\\s+TABLE\\s+' + q + tableName + qc + '\\s+ADD\\s+(?:CONSTRAINT\\s+[\\x60"\'\\w]+\\s+)?FOREIGN\\s+KEY\\s*\\(([^)]+)\\)\\s*REFERENCES\\s+' + q + '(\\w+)' + qc + '\\s*\\(([^)]+)\\)',
        'gi',
      )
      let alterMatch
      while ((alterMatch = alterFKRegex.exec(sqlContent)) !== null) {
        const fkCols = alterMatch[1].split(',').map(c => stripQuotes(c))
        const refTable = alterMatch[2]
        fkCols.forEach((colName) => {
          const col = columns.find(c => c.propertyName === colName)
          if (col) {
            col.isForeignKey = true
            col.referencedTable = refTable
          }
        })
      }

      entities.push({
        name: tableName,
        properties: columns,
        hasTimestamps: columns.some(c => ['created_at', 'createdat', 'updated_at', 'updatedat'].includes(c.propertyName.toLowerCase())),
        usesSoftDeletes: columns.some(c => ['deleted_at', 'deletedat'].includes(c.propertyName.toLowerCase())),
        _compositePK: compositePKs.length > 1 ? compositePKs : null,
      })
    }

    return entities
  }

  // ─── JSON PARSER ────────────────────────────────────────────────────────

  /**
   * Parse a JSON file. Supports two formats:
   * 1. Direct Moldata format: { nodes, edges } — re-import from export
   * 2. Entity/relationship format: { entities, relationships }
   */
  function parseJSONFile(jsonContent) {
    let data
    try {
      data = JSON.parse(jsonContent)
    } catch {
      throw new Error('Le fichier JSON est mal formé (syntaxe invalide). Vérifiez qu\'il ne contient pas d\'erreurs de virgules ou de guillemets manquants.')
    }

    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new Error('Le fichier JSON doit être un objet. Format attendu : { "nodes", "edges" } pour un re-import, ou { "entities", "relationships" } pour un import manuel.')
    }

    // Direct node/edge format (exported from Moldata)
    if (data.nodes && data.edges) {
      if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
        throw new Error('Les clés "nodes" et "edges" doivent être des tableaux. Le fichier semble corrompu.')
      }
      return { nodes: data.nodes, edges: data.edges, isDirect: true }
    }

    if (!data.entities && !data.nodes) {
      throw new Error('Format non reconnu : aucune clé "entities" ou "nodes" trouvée. Utilisez { "entities": [...], "relationships": [...] } pour un import manuel, ou exportez d\'abord un modèle depuis l\'app.')
    }

    if (data.entities && !Array.isArray(data.entities)) {
      throw new Error('La clé "entities" doit être un tableau d\'objets (ex: [{ "name": "User", "properties": [...] }]).')
    }

    // Entity/relationship structured format
    const entities = (data.entities || []).map((entity) => ({
      name: entity.name,
      properties: (entity.properties || []).map((prop) => ({
        id: uuidv4(),
        propertyName: prop.propertyName || prop.name,
        typeName: prop.typeName || prop.type || 'String',
        isPrimaryKey: prop.isPrimaryKey || false,
        autoIncrement: prop.autoIncrement || false,
        isForeignKey: prop.isForeignKey || false,
        isNullable: prop.isNullable || false,
        referencedTable: prop.referencedTable || prop.references || null,
      })),
      hasTimestamps: entity.hasTimestamps !== false,
      usesSoftDeletes: entity.usesSoftDeletes || false,
    }))

    const relationships = (data.relationships || []).map((rel) => ({
      name: rel.name || '',
      source: rel.source,
      target: rel.target,
      sourceCardinality: rel.sourceCardinality || '0,N',
      targetCardinality: rel.targetCardinality || '0,N',
      hasTimestamps: rel.hasTimestamps !== false,
      usesSoftDeletes: rel.usesSoftDeletes || false,
      properties: (rel.properties || []).map((prop) => ({
        id: uuidv4(),
        propertyName: prop.propertyName || prop.name,
        typeName: prop.typeName || prop.type || 'String',
        isPrimaryKey: false,
        autoIncrement: false,
        isForeignKey: false,
        isNullable: prop.isNullable || false,
      })),
    }))

    return { entities, relationships, isDirect: false }
  }

  // ─── NODE CREATION ──────────────────────────────────────────────────────

  /**
   * Convert parsed entities into Vue Flow nodes.
   * Junction tables (composite FK-only PK) are excluded — they become edges.
   * FK columns are removed from node data (in MCD, relationships are edges).
   */
  function createNodesFromEntities(entities) {
    // Detect junction tables to exclude them from nodes
    const junctionTableNames = new Set()
    for (const entity of entities) {
      if (!entity._compositePK || entity._compositePK.length < 2) continue
      const fkCols = entity.properties.filter(p => p.isForeignKey).map(p => p.propertyName)
      const allPKsAreFK = entity._compositePK.every(pk => fkCols.includes(pk))
      if (allPKsAreFK) junctionTableNames.add(entity.name)
    }

    const nodes = entities
      .filter(entity => !junctionTableNames.has(entity.name))
      .map((entity) => {
        // Remove FK columns — in MCD, relationships are edges, not columns
        const nonFKProperties = entity.properties.filter(p => !p.isForeignKey)

        // Ensure a PK exists
        const hasPK = nonFKProperties.some(p => p.isPrimaryKey)
        if (!hasPK) {
          const existingId = nonFKProperties.find(p => p.propertyName.toLowerCase() === 'id')
          if (existingId) {
            existingId.isPrimaryKey = true
            existingId.isNullable = false
            if (existingId.typeName === 'Integer') existingId.typeName = 'Big Integer'
          } else {
            nonFKProperties.unshift({
              id: uuidv4(),
              propertyName: 'id',
              typeName: 'Big Integer',
              isPrimaryKey: true,
              autoIncrement: true,
              isForeignKey: false,
              isNullable: false,
            })
          }
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
        }
      })

    const nodeMap = {}
    nodes.forEach((node) => {
      nodeMap[node.data.name] = node.id
    })

    return { nodes, nodeMap }
  }

  // ─── EDGE CREATION (FK-based, for SQL imports) ──────────────────────────

  /**
   * Derive edges from SQL entities by analysing FK columns:
   * - Junction tables (composite PK = all FKs) → N:N association edge
   *   with extra non-FK/non-PK columns as edge properties
   * - Self-referencing FK → reflexive edge with loopbackSide
   * - Regular FK → 1:N or 0,1:N edge depending on nullable
   *
   * Also detects ternary junction tables (3+ FKs in composite PK)
   * and creates ternary entity nodes with connecting edges.
   */
  function createEdgesFromEntities(entities, nodeMap) {
    const edges = []
    const ternaryNodes = []
    const ternaryEdges = []

    // Detect junction tables
    const junctionTables = new Map() // tableName → entity
    for (const entity of entities) {
      if (!entity._compositePK || entity._compositePK.length < 2) continue
      const fkCols = entity.properties.filter(p => p.isForeignKey).map(p => p.propertyName)
      const allPKsAreFK = entity._compositePK.every(pk => fkCols.includes(pk))
      if (allPKsAreFK) junctionTables.set(entity.name, entity)
    }

    for (const entity of entities) {
      if (junctionTables.has(entity.name)) {
        const junctionEntity = junctionTables.get(entity.name)
        const fks = junctionEntity.properties.filter(p => p.isForeignKey && p.referencedTable)

        // Non-FK, non-PK properties become edge/ternary properties
        const extraProps = junctionEntity.properties
          .filter(p => !p.isForeignKey && !p.isPrimaryKey
            && !['created_at', 'updated_at', 'deleted_at'].includes(p.propertyName.toLowerCase()))
          .map(p => ({
            id: uuidv4(),
            propertyName: p.propertyName,
            typeName: p.typeName,
            isPrimaryKey: false,
            autoIncrement: false,
            isForeignKey: false,
            isNullable: p.isNullable,
          }))

        const hasTimestamps = junctionEntity.properties.some(
          p => ['created_at', 'updated_at'].includes(p.propertyName.toLowerCase()),
        )

        if (fks.length === 2) {
          // Binary N:N relationship → association edge
          const sourceNode = nodeMap[fks[0].referencedTable]
          const targetNode = nodeMap[fks[1].referencedTable]
          if (sourceNode && targetNode) {
            const isReflexive = fks[0].referencedTable === fks[1].referencedTable

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
                name: junctionEntity.name,
                sourceCardinality: '0,N',
                targetCardinality: '0,N',
                properties: extraProps,
                hasTimestamps,
                usesSoftDeletes: false,
                isCIF: false,
                loopbackSide: isReflexive ? 'right' : null,
              },
            })
          }
        } else if (fks.length >= 3) {
          // Ternary (or higher) relationship → ternary entity node
          const ternaryId = `dndnode_${uuidv4()}_${uuidv4()}`
          ternaryNodes.push({
            id: ternaryId,
            type: 'ternaryEntity',
            position: { x: Math.random() * 600, y: Math.random() * 400 },
            draggable: true,
            selected: false,
            data: {
              name: junctionEntity.name,
              properties: extraProps,
              hasTimestamps,
              usesSoftDeletes: false,
            },
          })

          for (const fk of fks) {
            const entityNodeId = nodeMap[fk.referencedTable]
            if (entityNodeId) {
              ternaryEdges.push({
                id: `dndedge_${uuidv4()}_${uuidv4()}`,
                source: entityNodeId,
                target: ternaryId,
                sourceHandle: 's4',
                targetHandle: null,
                type: 'customEdge',
                updatable: true,
                selectable: true,
                label: '',
                data: {
                  name: '',
                  sourceCardinality: '0,N',
                  targetCardinality: '0,N',
                  properties: [],
                  hasTimestamps: false,
                  usesSoftDeletes: false,
                  isCIF: false,
                  loopbackSide: null,
                },
              })
            }
          }
        }
        continue
      }

      // Regular table → create edges from FKs (1:N or 0,1:N)
      for (const property of entity.properties) {
        if (!property.isForeignKey || !property.referencedTable) continue

        const sourceNode = nodeMap[property.referencedTable]
        const targetNode = nodeMap[entity.name]
        if (!sourceNode || !targetNode) continue

        const isReflexive = property.referencedTable === entity.name

        // Derive relationship name from column name (remove _id suffix)
        const relName = property.propertyName
          .replace(/_?id$/i, '')
          .replace(/([A-Z])/g, ' $1')
          .trim()

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
            name: relName,
            sourceCardinality: property.isNullable ? '0,1' : '1,1',
            targetCardinality: '0,N',
            properties: [],
            hasTimestamps: false,
            usesSoftDeletes: false,
            isCIF: false,
            loopbackSide: isReflexive ? 'right' : null,
          },
        })
      }
    }

    return { edges, ternaryNodes, ternaryEdges }
  }

  // ─── EDGE CREATION (relationship-based, for JSON entity/rel format) ─────

  function createEdgesFromRelationships(relationships, nodeMap) {
    const edges = []

    for (const rel of relationships) {
      const sourceId = nodeMap[rel.source]
      const targetId = nodeMap[rel.target]

      if (sourceId && targetId) {
        const isReflexive = rel.source === rel.target

        edges.push({
          id: `dndedge_${uuidv4()}_${uuidv4()}`,
          source: sourceId,
          target: targetId,
          sourceHandle: isReflexive ? 's2' : 's4',
          targetHandle: isReflexive ? 's3' : 's1',
          type: 'customEdge',
          updatable: true,
          selectable: true,
          label: '',
          data: {
            name: rel.name || '',
            sourceCardinality: rel.sourceCardinality || '0,N',
            targetCardinality: rel.targetCardinality || '0,N',
            properties: rel.properties || [],
            hasTimestamps: rel.hasTimestamps !== false,
            usesSoftDeletes: rel.usesSoftDeletes || false,
            isCIF: rel.isCIF || false,
            loopbackSide: isReflexive ? 'right' : (rel.loopbackSide || null),
          },
        })
      }
    }

    return edges
  }

  // ─── SAVE TO DATABASE ───────────────────────────────────────────────────

  async function saveNodesAndEdgesToDatabase(nodes, edges, modelId) {
    try {
      await $fetch('/api/models/import', {
        method: 'PUT',
        body: { modelId, nodes, edges },
      })
    } catch (error) {
      console.error("Error saving imported nodes and edges:", error)
    }
  }

  // ─── MAIN CONVERTERS ───────────────────────────────────────────────────

  async function convertSQLToFlowElements(sqlContent, modelId) {
    const entitiesFromSQL = parseSQLFile(sqlContent)
    if (!entitiesFromSQL.length) {
      throw new Error('Aucune instruction CREATE TABLE trouvée dans le fichier SQL. Assurez-vous que le fichier contient des définitions de tables valides (MySQL, PostgreSQL, SQLite ou SQL Server).')
    }

    const { nodes, nodeMap } = createNodesFromEntities(entitiesFromSQL)
    const { edges, ternaryNodes, ternaryEdges } = createEdgesFromEntities(entitiesFromSQL, nodeMap)

    const allNodes = [...nodes, ...ternaryNodes]
    const allEdges = [...edges, ...ternaryEdges]
    const layouted = await getLayoutedElements(allNodes, allEdges)

    await saveNodesAndEdgesToDatabase(layouted.nodes, layouted.edges, modelId)
    return { nodes: layouted.nodes, edges: layouted.edges }
  }

  async function convertJSONToFlowElements(jsonContent, modelId) {
    const parsed = parseJSONFile(jsonContent)

    // Direct node/edge format (re-import from Moldata export)
    if (parsed.isDirect) {
      const idRemap = new Map()
      const nodes = parsed.nodes.map((node) => {
        const newId = `dndnode_${uuidv4()}_${uuidv4()}`
        idRemap.set(node.id, newId)
        return { ...node, id: newId, selected: false }
      })
      const edges = parsed.edges.map((edge) => ({
        ...edge,
        id: `dndedge_${uuidv4()}_${uuidv4()}`,
        source: idRemap.get(edge.source) || edge.source,
        target: idRemap.get(edge.target) || edge.target,
        selected: false,
      }))
      const layouted = await getLayoutedElements(nodes, edges)
      await saveNodesAndEdgesToDatabase(layouted.nodes, layouted.edges, modelId)
      return { nodes: layouted.nodes, edges: layouted.edges }
    }

    // Entity/relationship structured format
    const { nodes, nodeMap } = createNodesFromEntities(parsed.entities)
    let edges
    if (parsed.relationships && parsed.relationships.length > 0) {
      edges = createEdgesFromRelationships(parsed.relationships, nodeMap)
    } else {
      const result = createEdgesFromEntities(parsed.entities, nodeMap)
      edges = [...result.edges, ...result.ternaryEdges]
    }

    const layouted = await getLayoutedElements(nodes, edges)
    await saveNodesAndEdgesToDatabase(layouted.nodes, layouted.edges, modelId)
    return { nodes: layouted.nodes, edges: layouted.edges }
  }

  return {
    convertSQLToFlowElements,
    convertJSONToFlowElements,
  }
}
