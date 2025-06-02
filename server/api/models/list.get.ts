import prisma from "~/lib/prisma";
import { auth } from "~/lib/auth";

export default defineEventHandler(async event => {
    const { selectedWorkspaceId } = getQuery(event);
    const session = await auth.api.getSession({
        headers: event.headers,
    })
    try {

        if (!session?.user?.email) {
            throw createError({
                statusCode: 401,
                message: "Unauthorized: User not authenticated"
            });
        }

        const query = getQuery(event);
        let models;

        try {
            const onlyTemplates = query.onlyTemplates === 'true';

            if (onlyTemplates) {
                models = await prisma.model.findMany({
                    where: {
                        workspaceId: selectedWorkspaceId,
                        // Galery: {
                        //     some: {},
                        // },
                    },
                    // include: {
                    //     Galery: {
                    //         include: {
                    //             category: true,
                    //         },
                    //     },
                    // },
                });
            } else {
                models = await prisma.model.findMany({
                    where: {
                        workspaceId: selectedWorkspaceId,
                    },
                });
            }
        } catch (error) {
            console.error('Error fetching models:', error);
            throw createError({
                statusCode: 500,
                message: "Database error while fetching models"
            });
        }

        return models;

    } catch (error) {
        console.error('Global error:', error);
        
    }
});