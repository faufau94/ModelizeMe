import prisma from "~/lib/prisma";

export default defineEventHandler(async event => {
    const { workspaceId } = getQuery(event);

    return await prisma.workspace.findUnique({
        where: {
            id: workspaceId,
        }
    })
})