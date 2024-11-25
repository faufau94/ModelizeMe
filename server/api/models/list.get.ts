import prisma from "~/lib/prisma";
import {getServerSession} from "#auth";

export default defineEventHandler(async event => {
    const session = await getServerSession(event);

    if (!session?.user?.email) {
        throw new Error("Session not found or user not authenticated");
    }

    const getCurrentUser = await prisma.user.findUnique({
        where: {
            email: session.user.email,
        }
    });

    if (!getCurrentUser) {
        throw new Error("Utilisateur non trouvé");
    }

    const query = getQuery(event);

    let models;
    if (query.onlyTemplates === 'true') {
        // Récupérer uniquement les modèles associés à des galeries avec leurs catégories
        models = await prisma.model.findMany({
            where: {
                userId: getCurrentUser.id,
                Galery: {
                    some: {},
                },
            },
            include: {
                Galery: {
                    include: {
                        category: true,
                    },
                },
            },
        });
    } else {
        // Récupérer tous les modèles de l'utilisateur
        models = await prisma.model.findMany({
            where: {
                userId: getCurrentUser.id,
            },
        });
    }

    return models;

});
