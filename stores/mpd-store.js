import { ref } from "vue";
import { defineStore } from "pinia";
import { MarkerType } from "@vue-flow/core";
import { v4 as uuidv4 } from "uuid";
import { getLayoutedElements } from "~/utils/useElk.js";

/**
 * Map logical type names to physical SQL types.
 */
const TYPE_MAP = {
  "Big Integer": "BIGINT",
  "Integer": "INT",
  "Small Integer": "SMALLINT",
  "String": "VARCHAR(255)",
  "Text": "TEXT",
  "Boolean": "BOOLEAN",
  "Float": "FLOAT",
  "Double": "DOUBLE",
  "Decimal": "DECIMAL(10,2)",
  "Date": "DATE",
  "DateTime": "DATETIME",
  "Timestamp": "TIMESTAMP",
  "Time": "TIME",
  "JSON": "JSON",
  "UUID": "UUID",
  "Binary": "BLOB",
};

function toPhysicalType(logicalType) {
  if (!logicalType) return "";
  return TYPE_MAP[logicalType] || logicalType.toUpperCase();
}

function toSnakeCase(str) {
  if (!str) return "";
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

export const useMPDStore = defineStore("flow-mpd", () => {
  const flowMPD = ref(null);

  function setFlowInstance(instance) {
    flowMPD.value = instance;
  }

  /**
   * Generate MPD (Modèle Physique de Données) from MCD nodes & edges.
   *
   * MPD rules:
   * - Table names in snake_case (or as-is if user prefers)
   * - Column names in snake_case
   * - Physical SQL types (BIGINT, VARCHAR, etc.)
   * - NOT NULL / NULL shown
   * - AUTO_INCREMENT shown
   * - PRIMARY KEY, FOREIGN KEY indicators
   * - Timestamps as physical columns (created_at TIMESTAMP, etc.)
   * - Same relationship logic as MLD (1:N, N:N junction tables)
   * - All read-only
   */
  async function generateMPD(nodes, edges) {
    if (!nodes?.length) return { nodesMPD: [], edgesMPD: [] };

    const nodesMap = new Map();
    for (const node of nodes) {
      const copy = JSON.parse(JSON.stringify(node));
      copy.draggable = false;
      copy.selectable = false;

      // Convert to physical representation
      copy.data.modelType = "mpd";
      copy.data.name = toSnakeCase(copy.data.name);
      copy.data.properties = copy.data.properties.map((prop) => ({
        ...prop,
        propertyName: toSnakeCase(prop.propertyName),
        typeName: toPhysicalType(prop.typeName),
      }));

      // Convert timestamps to explicit physical columns
      if (copy.data.hasTimestamps) {
        copy.data.hasTimestamps = false; // we'll add them as real properties
        const hasCreatedAt = copy.data.properties.some((p) => p.propertyName === "created_at");
        const hasUpdatedAt = copy.data.properties.some((p) => p.propertyName === "updated_at");
        if (!hasCreatedAt) {
          copy.data.properties.push({
            id: uuidv4(),
            propertyName: "created_at",
            typeName: "TIMESTAMP",
            isPrimaryKey: false,
            autoIncrement: false,
            isForeignKey: false,
            isNullable: true,
          });
        }
        if (!hasUpdatedAt) {
          copy.data.properties.push({
            id: uuidv4(),
            propertyName: "updated_at",
            typeName: "TIMESTAMP",
            isPrimaryKey: false,
            autoIncrement: false,
            isForeignKey: false,
            isNullable: true,
          });
        }
      }

      if (copy.data.usesSoftDeletes) {
        copy.data.usesSoftDeletes = false;
        const hasDeletedAt = copy.data.properties.some((p) => p.propertyName === "deleted_at");
        if (!hasDeletedAt) {
          copy.data.properties.push({
            id: uuidv4(),
            propertyName: "deleted_at",
            typeName: "TIMESTAMP",
            isPrimaryKey: false,
            autoIncrement: false,
            isForeignKey: false,
            isNullable: true,
          });
        }
      }

      nodesMap.set(copy.id, copy);
    }

    const mpdEdges = [];
    const extraNodes = [];

    for (const edge of edges) {
      const edgeCopy = JSON.parse(JSON.stringify(edge));
      edgeCopy.selectable = false;
      edgeCopy.updatable = false;
      edgeCopy.data.modelType = "mpd";

      const sourceCard = (edgeCopy.data.sourceCardinality || "").split(",");
      const targetCard = (edgeCopy.data.targetCardinality || "").split(",");

      const sourceNode = nodesMap.get(edgeCopy.source);
      const targetNode = nodesMap.get(edgeCopy.target);
      if (!sourceNode || !targetNode) continue;

      const srcMax = sourceCard[1]?.trim();
      const tgtMax = targetCard[1]?.trim();

      if (srcMax === "N" && tgtMax === "N") {
        // N:N → junction table
        const junctionId = `dndnode_${uuidv4()}_${uuidv4()}`;
        const junctionName = `${sourceNode.data.name}_${targetNode.data.name}`;

        const junctionProps = [
          {
            id: uuidv4(),
            propertyName: `${sourceNode.data.name}_id`,
            typeName: "BIGINT",
            isPrimaryKey: true,
            autoIncrement: false,
            isForeignKey: true,
            foreignTable: sourceNode.data.name,
            isNullable: false,
          },
          {
            id: uuidv4(),
            propertyName: `${targetNode.data.name}_id`,
            typeName: "BIGINT",
            isPrimaryKey: true,
            autoIncrement: false,
            isForeignKey: true,
            foreignTable: targetNode.data.name,
            isNullable: false,
          },
          ...(edgeCopy.data.properties || []).map((p) => ({
            ...p,
            propertyName: toSnakeCase(p.propertyName),
            typeName: toPhysicalType(p.typeName),
          })),
        ];

        extraNodes.push({
          id: junctionId,
          type: "customEntity",
          position: { x: 0, y: 0 },
          draggable: false,
          selectable: false,
          data: {
            name: junctionName,
            modelType: "mpd",
            isAssociation: true,
            hasTimestamps: false,
            usesSoftDeletes: false,
            properties: junctionProps,
          },
        });

        // Edges to junction
        mpdEdges.push({
          id: `dndedge_${uuidv4()}_${uuidv4()}`,
          source: sourceNode.id,
          target: junctionId,
          sourceHandle: "s4",
          targetHandle: "s1",
          type: "customEdge",
          markerEnd: MarkerType.ArrowClosed,
          selectable: false,
          updatable: false,
          data: { name: "", modelType: "mpd", sourceCardinality: "", targetCardinality: "", properties: [] },
        });

        mpdEdges.push({
          id: `dndedge_${uuidv4()}_${uuidv4()}`,
          source: junctionId,
          target: targetNode.id,
          sourceHandle: "s4",
          targetHandle: "s1",
          type: "customEdge",
          markerEnd: MarkerType.ArrowClosed,
          selectable: false,
          updatable: false,
          data: { name: "", modelType: "mpd", sourceCardinality: "", targetCardinality: "", properties: [] },
        });
      } else {
        // 1:N, N:1, 1:1 → add FK
        const makeForeignKey = (referencedTable) => ({
          id: uuidv4(),
          propertyName: `${referencedTable.data.name}_id`,
          typeName: "BIGINT",
          isPrimaryKey: false,
          autoIncrement: false,
          isForeignKey: true,
          foreignTable: referencedTable.data.name,
          isNullable: false,
        });

        if (srcMax === "1" && tgtMax === "N") {
          insertForeignKey(sourceNode, makeForeignKey(targetNode));
          edgeCopy.markerEnd = MarkerType.ArrowClosed;
        } else if (srcMax === "N" && tgtMax === "1") {
          insertForeignKey(targetNode, makeForeignKey(sourceNode));
          edgeCopy.markerEnd = MarkerType.ArrowClosed;
        } else if (srcMax === "1" && tgtMax === "1") {
          insertForeignKey(targetNode, makeForeignKey(sourceNode));
          edgeCopy.markerEnd = MarkerType.ArrowClosed;
        }

        edgeCopy.type = "customEdge";
        // Strip cardinalities — FK constraints replace them in MPD
        edgeCopy.data.sourceCardinality = "";
        edgeCopy.data.targetCardinality = "";
        mpdEdges.push(edgeCopy);
      }
    }

    const allNodes = [...nodesMap.values(), ...extraNodes];
    const result = await getLayoutedElements(allNodes, mpdEdges);
    return { nodesMPD: result.nodes, edgesMPD: result.edges };
  }

  return {
    flowMPD,
    generateMPD,
    setFlowInstance,
  };
});

function insertForeignKey(node, fkProp) {
  const exists = node.data.properties.some(
    (p) => p.isForeignKey && p.propertyName === fkProp.propertyName
  );
  if (exists) return;

  let insertIdx = 0;
  for (let i = 0; i < node.data.properties.length; i++) {
    if (node.data.properties[i].isPrimaryKey) insertIdx = i + 1;
  }
  node.data.properties.splice(insertIdx, 0, fkProp);
}
