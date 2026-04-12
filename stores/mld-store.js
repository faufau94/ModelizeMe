import { ref } from "vue";
import { defineStore } from "pinia";
import { MarkerType } from "@vue-flow/core";
import { v4 as uuidv4 } from "uuid";
import { getLayoutedElements, computeElkOptions } from "~/utils/useElk.js";

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

    // Track which nodes were originally ternary entities (before type conversion)
    const ternaryNodeIds = new Set();

    const nodesMap = new Map();
    for (const node of nodes) {
      const copy = JSON.parse(JSON.stringify(node));
      copy.draggable = false;
      copy.selectable = false;
      copy.data.modelType = "mld";
      // Convert ternary entities → regular entities (they become junction tables in MLD)
      if (copy.type === 'ternaryEntity') {
        ternaryNodeIds.add(copy.id);
        copy.type = 'customEntity';
        copy.data.isAssociation = true;
      }
      nodesMap.set(copy.id, copy);
    }

    const mldEdges = [];
    const extraNodes = [];

    // Reusable edge template for MLD edges (no cardinalities)
    const makeMldEdge = () => ({
      type: "customEdge",
      markerEnd: MarkerType.ArrowClosed,
      selectable: false,
      updatable: false,
      data: { name: "", modelType: "mld", sourceCardinality: "", targetCardinality: "", properties: [] },
    });

    for (const edge of edges) {
      const srcMax = (edge.data?.sourceCardinality || "").split(",")[1]?.trim();
      const tgtMax = (edge.data?.targetCardinality || "").split(",")[1]?.trim();

      const sourceNode = nodesMap.get(edge.source);
      const targetNode = nodesMap.get(edge.target);
      if (!sourceNode || !targetNode) continue;

      // Skip edges with missing cardinalities (orphan / incomplete edges)
      if (!srcMax && !tgtMax && !ternaryNodeIds.has(edge.source) && !ternaryNodeIds.has(edge.target)) continue;

      const isReflexive = edge.source === edge.target;
      const edgeName = edge.data?.name || '';
      const isTernaryTarget = ternaryNodeIds.has(edge.target);
      const isTernarySource = ternaryNodeIds.has(edge.source);

      // ── Ternary entity edge: handle BEFORE cardinality checks ──
      // Ternary edges may have varying cardinalities (0,N/0,N or 0,N/1,1)
      // depending on import source, so detect by node type instead.
      if (isTernaryTarget || isTernarySource) {
        const ternaryNode = isTernaryTarget ? targetNode : sourceNode;
        const entityNode = isTernaryTarget ? sourceNode : targetNode;
        insertForeignKey(ternaryNode, {
          id: uuidv4(),
          propertyName: `${entityNode.data.name.toLowerCase()}_id`,
          typeName: "Big Integer",
          isPrimaryKey: true,
          autoIncrement: false,
          isForeignKey: true,
          foreignTable: entityNode.data.name,
          isNullable: false,
          isUnique: false,
        });
        mldEdges.push({
          ...makeMldEdge(),
          id: `dndedge_${uuidv4()}_${uuidv4()}`,
          source: entityNode.id,
          target: ternaryNode.id,
          sourceHandle: "s4",
          targetHandle: "s1",
        });

      } else if (srcMax === "N" && tgtMax === "N") {
          // ── Regular N:N → junction table ──
          const junctionId = `dndnode_${uuidv4()}_${uuidv4()}`;
          const srcName = sourceNode.data.name.toLowerCase();
          const tgtName = targetNode.data.name.toLowerCase();

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
                  // Reflexive N:N fix: disambiguate column names
                  propertyName: isReflexive ? `${srcName}_source_id` : `${srcName}_id`,
                  typeName: "Big Integer",
                  isPrimaryKey: true,
                  autoIncrement: false,
                  isForeignKey: true,
                  foreignTable: sourceNode.data.name,
                  isNullable: false,
                  isUnique: false,
                },
                {
                  id: uuidv4(),
                  propertyName: isReflexive ? `${tgtName}_cible_id` : `${tgtName}_id`,
                  typeName: "Big Integer",
                  isPrimaryKey: true,
                  autoIncrement: false,
                  isForeignKey: true,
                  foreignTable: targetNode.data.name,
                  isNullable: false,
                  isUnique: false,
                },
                ...(edge.data?.properties || []).map((p) => ({ ...p })),
              ],
            },
          });

          mldEdges.push({ ...makeMldEdge(), id: `dndedge_${uuidv4()}_${uuidv4()}`, source: sourceNode.id, target: junctionId, sourceHandle: "s4", targetHandle: "s1" });
          mldEdges.push({ ...makeMldEdge(), id: `dndedge_${uuidv4()}_${uuidv4()}`, source: junctionId, target: targetNode.id, sourceHandle: "s4", targetHandle: "s1" });

      } else {
        // 1:N, N:1, 1:1 → add FK
        // Convention: srcMax = max # of sources per target, tgtMax = max # of targets per source
        // FK goes on the "many" side (the entity that has N of the other)
        // Derive nullability from the min cardinality of the FK holder side
        const makeFk = (refTable, customName = null, nullable = false) => ({
          id: uuidv4(),
          propertyName: customName || `${refTable.data.name.toLowerCase()}_id`,
          typeName: "Big Integer",
          isPrimaryKey: false,
          autoIncrement: false,
          isForeignKey: true,
          foreignTable: refTable.data.name,
          isNullable: nullable,
          isUnique: false,
        });

        // Reflexive 1:N fix: use relation name for FK to avoid name collision
        const reflexiveFkName = (isReflexive && edgeName)
          ? `${edgeName.toLowerCase()}_id`
          : null;

        // Min cardinality: "0,N" → min=0 → nullable, "1,N" → min=1 → not null
        const srcMin = (edge.data?.sourceCardinality || "").split(",")[0]?.trim();
        const tgtMin = (edge.data?.targetCardinality || "").split(",")[0]?.trim();

        // Determine which side holds the FK and which is the referenced table
        // Arrow should point FROM the FK holder TO the referenced table
        let fkHolderIsSource = false;
        if (srcMax === "1" && tgtMax === "N") {
          // FK on target, referencing source → arrow: target → source
          insertForeignKey(targetNode, makeFk(sourceNode, reflexiveFkName, srcMin === "0"));
          fkHolderIsSource = false;
        } else if (srcMax === "N" && tgtMax === "1") {
          // FK on source, referencing target → arrow: source → target
          insertForeignKey(sourceNode, makeFk(targetNode, reflexiveFkName, tgtMin === "0"));
          fkHolderIsSource = true;
        } else if (srcMax === "1" && tgtMax === "1") {
          // FK on target, referencing source → arrow: target → source
          insertForeignKey(targetNode, makeFk(sourceNode, reflexiveFkName, srcMin === "0"));
          fkHolderIsSource = false;
        }

        // Strip cardinalities - FK replaces them in MLD
        // Arrow points from FK holder to referenced table
        const edgeCopy = JSON.parse(JSON.stringify(edge));
        const mldEdge = {
          ...edgeCopy,
          type: "customEdge",
          selectable: false,
          updatable: false,
          data: {
            ...edge.data,
            modelType: "mld",
            sourceCardinality: "",
            targetCardinality: "",
          },
        };

        if (fkHolderIsSource) {
          // source has FK → arrow points to target (referenced) = markerEnd
          mldEdge.markerEnd = MarkerType.ArrowClosed;
          delete mldEdge.markerStart;
        } else {
          // target has FK → arrow points to source (referenced) = markerStart
          mldEdge.markerStart = MarkerType.ArrowClosed;
          delete mldEdge.markerEnd;
        }

        mldEdges.push(mldEdge);
      }
    }

    const allNodes = [...nodesMap.values(), ...extraNodes];
    const opts = computeElkOptions(allNodes);
    opts['elk.direction'] = 'RIGHT';
    const result = await getLayoutedElements(allNodes, mldEdges, opts);
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
