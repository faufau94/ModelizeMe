import prisma from "~/lib/prisma";

export default defineEventHandler(async event => {

    const { name } = await readBody(event);

    // const session = await getServerSession(event);


    // const getCurrentUser = await prisma.user.findUnique({
    //   where: {
    //     email: session?.user?.email,
    //   }
    // })

    const newCategory = await prisma.category.create({
        data: {
            name: name,
        },
    })

    return newCategory
});