import prisma from "~/lib/prisma";
import { auth } from "~/lib/auth";

export default defineEventHandler(async event => {
    const { workspaceId } = getQuery(event);
    const session = await auth.api.getSession({
        headers: event.headers,
    })

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