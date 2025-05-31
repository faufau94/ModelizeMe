import prisma from "~/lib/prisma";

export default defineEventHandler(async event => {

    const { idModel, idCategory } = await readBody(event);

    // const session = await getServerSession(event);


    // const getCurrentUser = await prisma.user.findUnique({
    //   where: {
    //     email: session?.user?.email,
    //   }
    // })

    const newGalery = await prisma.galery.create({
        data: {
            model: {
                connect: { id: parseInt(idModel) },
            },
            category: {
                connect: { id: parseInt(idCategory) },
            },
        },
    });

    return newGalery
});