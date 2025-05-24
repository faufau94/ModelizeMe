import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);   
    const { id } = query;
    
    // remove the class by id
    const classObj = await prisma.class.delete({
        where: { id },
    });

    return classObj;
});
