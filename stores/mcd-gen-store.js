import { ref } from "vue";
import { defineStore } from "pinia";
import { autoLayout } from "~/utils/useAutoLayout.js";

export const useMCDGenStore = defineStore("flow-mcd-gen", () => {
  const flowMCDGen = ref(null);

  function setFlowInstance(instance) {
    flowMCDGen.value = instance;
  }

  /**
   * Generate a true MCD (Modèle Conceptuel de Données) from the editable model.
   *
   * MCD rules:
   * - Entities show name + property names only (no types, no nullable indicators)
   * - Primary keys are underlined (kept via isPrimaryKey flag)
   * - No timestamps, no softDeletes
   * - Foreign keys are NOT shown (they belong to MLD/MPD)
   * - Associations (N:N) are shown as diamond-shaped association nodes
   * - Edges show cardinalities
   * - All nodes are read-only (not draggable, not selectable)
   */
  function generateMCD(nodes, edges) {
    if (!nodes || !edges) return { nodesMCD: [], edgesMCD: [] };

    const mcdNodes = nodes.map((node) => {
      const copy = JSON.parse(JSON.stringify(node));

      // Filter out foreign keys — they don't exist in MCD
      copy.data.properties = copy.data.properties
        .filter((prop) => !prop.isForeignKey)
        .map((prop) => ({
          ...prop,
          typeName: "", // hide types in MCD
          isNullable: false, // not relevant in MCD
          autoIncrement: false, // not relevant in MCD
        }));

      // No timestamps/softDeletes in conceptual view
      copy.data.hasTimestamps = false;
      copy.data.usesSoftDeletes = false;

      // Mark as read-only
      copy.draggable = false;
      copy.selectable = false;

      // Tag for model type
      copy.data.modelType = "mcd";

      return copy;
    });

    const mcdEdges = edges.map((edge) => {
      const copy = JSON.parse(JSON.stringify(edge));
      copy.selectable = false;
      copy.updatable = false;
      copy.data.modelType = "mcd";
      return copy;
    });

    // Apply auto-layout for clean positioning
    const { nodes: layoutedNodes, edges: layoutedEdges } = autoLayout(mcdNodes, mcdEdges);

    return { nodesMCD: layoutedNodes, edgesMCD: layoutedEdges };
  }

  return {
    flowMCDGen,
    setFlowInstance,
    generateMCD,
  };
});
