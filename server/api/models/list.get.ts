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

            const where: any = {
                workspaceId: selectedWorkspaceId,
                ...(onlyTemplates && { Galery: { some: {} } }),
            };

            models = await prisma.model.findMany({
                where,
                ...(onlyTemplates && {
                    include: {
                        Galery: {
                            include: { category: true },
                        },
                    },
                }),
                include: {
                    team: true,
                },
            });
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