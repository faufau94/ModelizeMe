import prisma from "~/lib/prisma";
import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
    // Lire le corps de la requête
    const body = await readBody(event);

    // Vérifier que toutes les informations nécessaires sont présentes
    if (!body.modelId || !body.nodes || !body.edges) {
        throw new Error("Les informations du modèle, des nœuds ou des arêtes sont manquantes");
    }

    // Récupérer le modèle existant
    const existingModel = await prisma.model.findUnique({
        where: {
            id: parseInt(body.modelId),
        },
    });

    if (!existingModel) {
        throw new Error("Modèle introuvable");
    }

    // Fusionner les nœuds et arêtes existants avec les nouveaux
    const mergedNodes = [...existingModel.nodes, ...body.nodes];
    const mergedEdges = [...existingModel.edges, ...body.edges];

    // Mise à jour du modèle en base de données en ajoutant les nouveaux nœuds et arêtes
    const updatedModel = await prisma.model.update({
        where: {
            id: parseInt(body.modelId),
        },
        data: {
            nodes: mergedNodes,
            edges: mergedEdges,
        },
    });

    return updatedModel;
});
