import prisma from "~/lib/prisma";
import {getServerSession} from "#auth";

export default defineEventHandler(async event => {

    const session = await getServerSession(event);

    const getCurrentUser = await prisma.user.findUnique({
        where: {
            email: session?.user?.email,
        }
    });

    if (!getCurrentUser) {
        throw new Error("Utilisateur non trouvé");
    }

    const query = getQuery(event);

    if (query.onlyTemplates === 'true') {
        // Récupérer uniquement les modèles associés à des galeries avec leurs catégories
        return await prisma.model.findMany({
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
        return await prisma.model.findMany({
            where: {
                userId: getCurrentUser.id,
            },
        });
    }

});
