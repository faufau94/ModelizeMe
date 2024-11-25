import prisma from "~/lib/prisma";
import { getServerSession } from "#auth";
import {H3Error} from "h3";

export default defineEventHandler(async event => {
    try {
        const session = await getServerSession(event);

        if (!session?.user?.email) {
            throw createError({
                statusCode: 401,
                message: "Unauthorized: User not authenticated"
            });
        }

        const getCurrentUser = await prisma.user.findUnique({
            where: {
                email: session.user.email,
            }
        }).catch(error => {
            console.error('Error finding user:', error);
            throw createError({
                statusCode: 500,
                message: "Database error while finding user"
            });
        });

        if (!getCurrentUser) {
            throw createError({
                statusCode: 404,
                message: "User not found"
            });
        }

        const query = getQuery(event);
        let models;

        try {
            if (query.onlyTemplates === 'true') {
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
                models = await prisma.model.findMany({
                    where: {
                        userId: getCurrentUser.id,
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