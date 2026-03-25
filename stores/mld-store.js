import { ref } from "vue";
import { defineStore } from "pinia";
import { MarkerType } from "@vue-flow/core";
import { v4 as uuidv4 } from "uuid";
import { getLayoutedElements } from "~/utils/useElk.js";

export const useMLDStore = defineStore("flow-mld", () => {
  const flowMLD = ref(null);

  function setFlowInstance(instance) {
    flowMLD.value = instance;
  }

  /**
   * Generate MLD (Modèle Logique de Données) from MCD nodes & edges.
   * MLD: table names, columns with types, PK underlined, FK with #,
   * 1:N/N:1 → FK, 1:1 → FK on target, N:N → junction table.
   * No cardinalities on edges (FK replaces this concept).
   */
  async function generateMLD(nodes, edges) {
    if (!nodes?.length) return { nodesMLD: [], edgesMLD: [] };

    const nodesMap = new Map();
    for (const node of nodes) {
      const copy = JSON.parse(JSON.stringify(node));
      copy.draggable = false;
      copy.selectable = false;
      copy.data.modelType = "mld";
      nodesMap.set(copy.id, copy);
    }

    const mldEdges = [];
    const extraNodes = [];

    for (const edge of edges) {
      const srcMax = (edge.data?.sourceCardinality || "").split(",")[1]?.trim();
      const tgtMax = (edge.data?.targetCardinality || "").split(",")[1]?.trim();

      const sourceNode = nodesMap.get(edge.source);
      const targetNode = nodesMap.get(edge.target);
      if (!sourceNode || !targetNode) continue;

      if (srcMax === "N" && tgtMax === "N") {
        // N:N → junction table
        const junctionId = `dndnode_${uuidv4()}_${uuidv4()}`;
        extraNodes.push({
          id: junctionId,
          type: "customEntity",
          position: { x: 0, y: 0 },
          draggable: false,
          selectable: false,
          data: {
            name: `${sourceNode.data.name}_${targetNode.data.name}`,
            modelType: "mld",
            isAssociation: true,
            hasTimestamps: edge.data?.hasTimestamps ?? true,
            usesSoftDeletes: edge.data?.usesSoftDeletes ?? false,
            properties: [
              {
                id: uuidv4(),
                propertyName: `${sourceNode.data.name.toLowerCase()}_id`,
                typeName: "Big Integer",
                isPrimaryKey: true,
                autoIncrement: false,
                isForeignKey: true,
                foreignTable: sourceNode.data.name,
                isNullable: false,
              },
              {
                id: uuidv4(),
                propertyName: `${targetNode.data.name.toLowerCase()}_id`,
                typeName: "Big Integer",
                isPrimaryKey: true,
                autoIncrement: false,
                isForeignKey: true,
                foreignTable: targetNode.data.name,
                isNullable: false,
              },
              ...(edge.data?.properties || []).map((p) => ({ ...p })),
            ],
          },
        });

        const baseEdge = {
          type: "customEdge",
          markerEnd: MarkerType.ArrowClosed,
          selectable: false,
          updatable: false,
          data: { name: "", modelType: "mld", sourceCardinality: "", targetCardinality: "", properties: [] },
        };
        mldEdges.push({ ...baseEdge, id: `dndedge_${uuidv4()}_${uuidv4()}`, source: sourceNode.id, target: junctionId, sourceHandle: "s4", targetHandle: "s1" });
        mldEdges.push({ ...baseEdge, id: `dndedge_${uuidv4()}_${uuidv4()}`, source: junctionId, target: targetNode.id, sourceHandle: "s4", targetHandle: "s1" });

      } else {
        // 1:N, N:1, 1:1 → add FK
        const makeFk = (refTable) => ({
          id: uuidv4(),
          propertyName: `${refTable.data.name.toLowerCase()}_id`,
          typeName: "Big Integer",
          isPrimaryKey: false,
          autoIncrement: false,
          isForeignKey: true,
          foreignTable: refTable.data.name,
          isNullable: false,
        });

        if (srcMax === "1" && tgtMax === "N") insertForeignKey(sourceNode, makeFk(targetNode));
        else if (srcMax === "N" && tgtMax === "1") insertForeignKey(targetNode, makeFk(sourceNode));
        else if (srcMax === "1" && tgtMax === "1") insertForeignKey(targetNode, makeFk(sourceNode));

        // Strip cardinalities — FK replaces them in MLD
        mldEdges.push({
          ...JSON.parse(JSON.stringify(edge)),
          type: "customEdge",
          markerEnd: MarkerType.ArrowClosed,
          selectable: false,
          updatable: false,
          data: {
            ...edge.data,
            modelType: "mld",
            sourceCardinality: "",
            targetCardinality: "",
          },
        });
      }
    }

    const allNodes = [...nodesMap.values(), ...extraNodes];
    const result = await getLayoutedElements(allNodes, mldEdges);
    return { nodesMLD: result.nodes, edgesMLD: result.edges };
  }

  return { flowMLD, generateMLD, setFlowInstance };
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
