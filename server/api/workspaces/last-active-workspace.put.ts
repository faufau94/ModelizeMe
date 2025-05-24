import prisma from "~/lib/prisma";
import { getServerSession } from "#auth";

export default defineEventHandler(async event => {
    const { workspaceId } = getQuery(event);
    const session = await getServerSession(event);

    // Update lastActiveWorkspaceId by adding the workspaceId
    await prisma.user.update({
        where: {
            id: session.user.id,
        },
        data: {
            lastActiveWorkspaceId: workspaceId,
        },
    });

})