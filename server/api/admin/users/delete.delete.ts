import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const id = parseInt(query.id);
    

    // remove his role
    await prisma.userRole.deleteMany({
        where: {
            userId: id,
        },
    });
    
    // remove the user by id
    const user = await prisma.user.delete({
        where: { id },
    });

    return user;
});
