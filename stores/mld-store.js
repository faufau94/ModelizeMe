import { ref } from "vue";
import { defineStore } from "pinia";
import { MarkerType } from "@vue-flow/core";
import { v4 as uuidv4 } from "uuid";
import { autoLayout } from "~/utils/useAutoLayout.js";

export const useMLDStore = defineStore("flow-mld", () => {
  const flowMLD = ref(null);

  function setFlowInstance(instance) {
    flowMLD.value = instance;
  }

  /**
   * Generate MLD (Modèle Logique de Données) from MCD nodes & edges.
   *
   * MLD rules:
   * - Tables show name, all columns WITH types
   * - Primary keys underlined, foreign keys prefixed with #
   * - 1:N → FK added on the "many" side (or "1" side pointing to N)
   * - 1:1 → FK added on one side
   * - N:N → junction/association table created with 2 FKs + edge properties
   * - Timestamps & softDeletes kept as-is
   * - All read-only
   */
  function generateMLD(nodes, edges) {
    if (!nodes || !edges) return { nodesMLD: [], edgesMLD: [] };

    // Deep-copy input to avoid mutating the original MCD data
    const nodesMap = new Map();
    for (const node of nodes) {
      const copy = JSON.parse(JSON.stringify(node));
      copy.draggable = false;
      copy.selectable = false;
      copy.data.modelType = "mld";
      nodesMap.set(copy.id, copy);
    }

    const mldEdges = [];
    const extraNodes = []; // junction tables for N:N

    for (const edge of edges) {
      const edgeCopy = JSON.parse(JSON.stringify(edge));
      edgeCopy.selectable = false;
      edgeCopy.updatable = false;
      edgeCopy.data.modelType = "mld";

      const sourceCard = (edgeCopy.data.sourceCardinality || "").split(",");
      const targetCard = (edgeCopy.data.targetCardinality || "").split(",");

      const sourceNode = nodesMap.get(edgeCopy.source);
      const targetNode = nodesMap.get(edgeCopy.target);
      if (!sourceNode || !targetNode) continue;

      const srcMax = sourceCard[1]?.trim();
      const tgtMax = targetCard[1]?.trim();

      if (srcMax === "N" && tgtMax === "N") {
        // ─── N:N → Create junction table ───
        const junctionId = `dndnode_${uuidv4()}_${uuidv4()}`;
        const junctionName = `${sourceNode.data.name}_${targetNode.data.name}`;

        const junctionNode = {
          id: junctionId,
          type: "customEntity",
          position: { x: 0, y: 0 }, // will be repositioned by auto-layout
          draggable: false,
          selectable: false,
          data: {
            name: junctionName,
            modelType: "mld",
            isAssociation: true,
            hasTimestamps: edgeCopy.data.hasTimestamps ?? true,
            usesSoftDeletes: edgeCopy.data.usesSoftDeletes ?? false,
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
              ...(edgeCopy.data.properties || []).map((p) => ({ ...p })),
            ],
          },
        };

        extraNodes.push(junctionNode);

        // Edge 1: source → junction
        mldEdges.push({
          id: `dndedge_${uuidv4()}_${uuidv4()}`,
          source: sourceNode.id,
          target: junctionId,
          sourceHandle: "s4",
          targetHandle: "s1",
          type: "customEdge",
          markerEnd: MarkerType.ArrowClosed,
          selectable: false,
          updatable: false,
          data: {
            name: "",
            modelType: "mld",
            sourceCardinality: "",
            targetCardinality: "",
            properties: [],
          },
        });

        // Edge 2: junction → target
        mldEdges.push({
          id: `dndedge_${uuidv4()}_${uuidv4()}`,
          source: junctionId,
          target: targetNode.id,
          sourceHandle: "s4",
          targetHandle: "s1",
          type: "customEdge",
          markerEnd: MarkerType.ArrowClosed,
          selectable: false,
          updatable: false,
          data: {
            name: "",
            modelType: "mld",
            sourceCardinality: "",
            targetCardinality: "",
            properties: [],
          },
        });
      } else {
        // ─── 1:N, N:1, or 1:1 → add FK to appropriate table ───
        const makeForeignKey = (referencedTable, relationship) => ({
          id: uuidv4(),
          propertyName: `${referencedTable.data.name.toLowerCase()}_id`,
          typeName: "Big Integer",
          isPrimaryKey: false,
          autoIncrement: false,
          isForeignKey: true,
          foreignTable: referencedTable.data.name,
          isNullable: false,
          relationship,
        });

        if (srcMax === "1" && tgtMax === "N") {
          // source has max 1, target has max N → FK goes on source side (the "many" side carries FK in Merise: the side with max=1 references the N side? Actually no — in Merise 1:N, the FK goes on the N side)
          // Correction: source cardinality x,1 means source can appear at most 1 time for target.
          // If source max is 1 and target max is N: each source row relates to at most 1 target, but each target relates to N sources → FK on source side
          const fk = makeForeignKey(targetNode, "ManyToOne");
          insertForeignKey(sourceNode, fk);
          edgeCopy.markerEnd = MarkerType.ArrowClosed;
        } else if (srcMax === "N" && tgtMax === "1") {
          const fk = makeForeignKey(sourceNode, "ManyToOne");
          insertForeignKey(targetNode, fk);
          edgeCopy.markerEnd = MarkerType.ArrowClosed;
        } else if (srcMax === "1" && tgtMax === "1") {
          // 1:1 → FK on either side (convention: on target)
          const fk = makeForeignKey(sourceNode, "OneToOne");
          insertForeignKey(targetNode, fk);
          edgeCopy.markerEnd = MarkerType.ArrowClosed;
        }

        edgeCopy.type = "customEdge";
        mldEdges.push(edgeCopy);
      }
    }

    // Collect all nodes
    const allNodes = [...nodesMap.values(), ...extraNodes];

    // Apply auto-layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = autoLayout(allNodes, mldEdges);

    return { nodesMLD: layoutedNodes, edgesMLD: layoutedEdges };
  }

  return {
    flowMLD,
    generateMLD,
    setFlowInstance,
  };
});

/**
 * Insert a FK property right after the primary key(s).
 */
function insertForeignKey(node, fkProp) {
  // Check if this FK already exists (avoid duplicates from multiple passes)
  const exists = node.data.properties.some(
    (p) => p.isForeignKey && p.propertyName === fkProp.propertyName
  );
  if (exists) return;

  // Find index after last PK
  let insertIdx = 0;
  for (let i = 0; i < node.data.properties.length; i++) {
    if (node.data.properties[i].isPrimaryKey) insertIdx = i + 1;
  }
  node.data.properties.splice(insertIdx, 0, fkProp);
}
