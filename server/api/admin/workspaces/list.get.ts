import prisma from "~/lib/prisma";

export default defineEventHandler(async event => {  
    
    // get workspaces from prisma with the associated user through the ownerId
    return await prisma.workspace.findMany({
        include: {
            owner: true,
        },
    });
});

