import prisma from "~/lib/prisma";
import { getServerSession } from "#auth";
import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
    // Lire le corps de la requête
    const body = await readBody(event);
    console.log(body);

    // Vérifier que toutes les informations nécessaires sont présentes
    if (!body.modelId || !body.nodes || !body.edges) {
        throw new Error("Les informations du modèle, des nœuds ou des arêtes sont manquantes");
    }

    // Mise à jour du modèle en base de données en écrasant les nœuds et arêtes existants
    const updatedModel = await prisma.model.update({
        where: {
            id: parseInt(body.modelId),
        },
        data: {
            nodes: body.nodes,
            edges: body.edges,
        },
    });

    return updatedModel;
});
