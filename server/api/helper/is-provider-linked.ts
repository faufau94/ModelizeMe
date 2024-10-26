import prisma from '@/lib/prisma';
export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const {provider, userId} = body;

    return await prisma.linkedaccount.findFirst({
        where: {
            id: userId,
            provider,
        },
    });
});