import prisma from "~/lib/prisma";
import { getServerSession } from "#auth";
import {H3Error} from "h3";

export default defineEventHandler(async event => {
    const { selectedWorkspaceId } = getQuery(event);
    const session = await getServerSession(event);
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
        throw error instanceof H3Error ? error : createError({
            statusCode: 500,
            message: "Internal server error",
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});