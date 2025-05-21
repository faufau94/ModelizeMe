import prisma from "~/lib/prisma";
import { getServerSession } from "#auth";

export default defineEventHandler(async event => {  
    
    // get workspaces from prisma with the associated user through the ownerId
    // but only the workspace of the user with the id in session
    const session = await getServerSession(event);
    
    return await prisma.workspace.findMany({
        where: {
            ownerId: session?.user?.id,
        },
        include: {
            owner: true,
        }
    });
});

