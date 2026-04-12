import { ref } from "vue";
import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";
import { getLayoutedElements, computeElkOptions } from "~/utils/useElk.js";

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
   * Generate MPD (Modèle Physique de Données) from MLD nodes & edges.
   *
   * Takes MLD output (already has correct FK, junction tables, ternary handling)
   * and converts to physical representation:
   * - snake_case table/column names
   * - Physical SQL types (BIGINT, VARCHAR, etc.)
   * - Timestamps materialized as real columns (created_at, updated_at)
   * - SoftDeletes materialized as deleted_at column
   * - FK foreignTable references updated to snake_case
   */
  async function generateMPD(mldNodes, mldEdges) {
    if (!mldNodes?.length) return { nodesMPD: [], edgesMPD: [] };

    // Build a name mapping: original MLD name → snake_case name
    const nameMap = new Map();
    for (const node of mldNodes) {
      nameMap.set(node.data.name, toSnakeCase(node.data.name));
    }

    const mpdNodes = mldNodes.map((node) => {
      const copy = JSON.parse(JSON.stringify(node));
      copy.data.modelType = "mpd";
      copy.data.name = toSnakeCase(copy.data.name);

      // Convert properties to physical types + snake_case
      copy.data.properties = copy.data.properties.map((prop) => ({
        ...prop,
        propertyName: toSnakeCase(prop.propertyName),
        typeName: toPhysicalType(prop.typeName),
        // Update foreignTable reference to snake_case
        ...(prop.foreignTable ? { foreignTable: nameMap.get(prop.foreignTable) || toSnakeCase(prop.foreignTable) } : {}),
      }));

      // Materialize timestamps as explicit physical columns
      if (copy.data.hasTimestamps) {
        copy.data.hasTimestamps = false;
        if (!copy.data.properties.some((p) => p.propertyName === "created_at")) {
          copy.data.properties.push({
            id: uuidv4(),
            propertyName: "created_at",
            typeName: "TIMESTAMP",
            isPrimaryKey: false,
            autoIncrement: false,
            isForeignKey: false,
            isNullable: true,
            isUnique: false,
          });
        }
        if (!copy.data.properties.some((p) => p.propertyName === "updated_at")) {
          copy.data.properties.push({
            id: uuidv4(),
            propertyName: "updated_at",
            typeName: "TIMESTAMP",
            isPrimaryKey: false,
            autoIncrement: false,
            isForeignKey: false,
            isNullable: true,
            isUnique: false,
          });
        }
      }

      if (copy.data.usesSoftDeletes) {
        copy.data.usesSoftDeletes = false;
        if (!copy.data.properties.some((p) => p.propertyName === "deleted_at")) {
          copy.data.properties.push({
            id: uuidv4(),
            propertyName: "deleted_at",
            typeName: "TIMESTAMP",
            isPrimaryKey: false,
            autoIncrement: false,
            isForeignKey: false,
            isNullable: true,
            isUnique: false,
          });
        }
      }

      return copy;
    });

    // Edges: just switch modelType to mpd
    const mpdEdges = mldEdges.map((edge) => {
      const copy = JSON.parse(JSON.stringify(edge));
      copy.data.modelType = "mpd";
      return copy;
    });

    const opts = computeElkOptions(mpdNodes);
    opts['elk.direction'] = 'RIGHT';
    const result = await getLayoutedElements(mpdNodes, mpdEdges, opts);
    return { nodesMPD: result.nodes, edgesMPD: result.edges };
  }

  return {
    flowMPD,
    generateMPD,
    setFlowInstance,
  };
});
