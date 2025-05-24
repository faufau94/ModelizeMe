import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  
    const body = await readBody(event);
    const query = getQuery(event);
    const id = parseInt(query.id);
    
    const { role, ...userInfo } = body;

    // Check if the user exists
    const user = await prisma.user.findUnique({
        where: { id },
    });
    
    if (!user) {
        throw createError({ statusCode: 404, statusMessage: "User not found" });
    }

    
    
    // Update the user with his role
    const updatedUser = await prisma.user.update({
        where: { id },
        data: {
            ...userInfo,
            roleId: role,
        },
        include: {
            role: true,
        },
    });
    
    return {
        status: 200,
        body: {
            message: 'Les informations ont été modifiées'
        }
    }
})