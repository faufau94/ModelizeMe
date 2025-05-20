import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const id = parseInt(query.id);
    
    
    // remove the user by id
    const user = await prisma.user.delete({
        where: { id },
    });

    return user;
});
