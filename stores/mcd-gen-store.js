import { ref } from "vue";
import { defineStore } from "pinia";
import { useVueFlow } from "@vue-flow/core";

export const useMCDGenStore = defineStore("flow-mcd-gen", () => {
  const flowMCDGen = ref(null);

  function setFlowInstance(instance) {
    flowMCDGen.value = instance;
  }

  /**
   * Generate a true MCD from the "classique" (editable) nodes & edges.
   * MCD = entities with property names only (no types, no nullable, no timestamps/softDeletes),
   * associations shown via edges with cardinalities.
   */
  function generateMCD(nodes, edges) {
    const mcdNodes = nodes.map((node) => {
      const copy = JSON.parse(JSON.stringify(node));
      // Strip types and technical fields — keep only property names + key indicators
      copy.data.properties = copy.data.properties.map((prop) => ({
        ...prop,
        typeName: "", // hide types in MCD
      }));
      // Don't show timestamps/softDeletes in conceptual view
      copy.data.hasTimestamps = false;
      copy.data.usesSoftDeletes = false;
      // Mark as read-only
      copy.draggable = false;
      copy.selectable = false;
      return copy;
    });

    const mcdEdges = edges.map((edge) => {
      const copy = JSON.parse(JSON.stringify(edge));
      copy.selectable = false;
      copy.updatable = false;
      return copy;
    });

    return { nodesMCD: mcdNodes, edgesMCD: mcdEdges };
  }

  return {
    flowMCDGen,
    setFlowInstance,
    generateMCD,
  };
});
