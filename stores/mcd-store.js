import { ref } from "vue";
import { defineStore } from "pinia";
import { getLayoutedElements, computeElkOptions } from "~/utils/useElk.js";

export const useMCDStore = defineStore("flow-mcd", () => {
  const flowMCDGen = ref(null);

  function setFlowInstance(instance) {
    flowMCDGen.value = instance;
  }

  /**
   * Generate a true MCD (Modèle Conceptuel de Données) from the editable model.
   * MCD: entity names + property names only (no types), PK underlined,
   * no FK, no timestamps, cardinalities shown on edges.
   */
  async function generateMCD(nodes, edges) {
    if (!nodes?.length) return { nodesMCD: [], edgesMCD: [] };

    const mcdNodes = nodes.map((node) => {
      const copy = JSON.parse(JSON.stringify(node));
      copy.data.properties = copy.data.properties
        .filter((prop) => !prop.isForeignKey)
        .map((prop) => ({ ...prop, typeName: "", isNullable: false, autoIncrement: false }));
      copy.data.hasTimestamps = false;
      copy.data.usesSoftDeletes = false;
      copy.draggable = false;
      copy.selectable = false;
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

    const opts = computeElkOptions(mcdNodes);
    opts['elk.direction'] = 'RIGHT';
    const result = await getLayoutedElements(mcdNodes, mcdEdges, opts);
    return { nodesMCD: result.nodes, edgesMCD: result.edges };
  }

  return { flowMCDGen, setFlowInstance, generateMCD };
});
