import prisma from "~/lib/prisma";

export default defineEventHandler(async event => {  
    
    // get classes from prisma with the associated user through the ownerId
    return await prisma.class.findMany({
        include: {
            owner: true,
        },
    });






});

