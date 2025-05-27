import prisma from "~/lib/prisma";
import {getServerSession} from "#auth";

export default defineEventHandler(async event => {

    const { title, selectedWorkspaceId } = await readBody(event);

    const session = await getServerSession(event);

    const newModelCreated = await prisma.model.create({
        data: {
            name: title,
            author: {
                connect: { id: session.user.id }
            },
            workspace: {
                connect: { id: selectedWorkspaceId }
            },
        },
    })

    if (!newModelCreated) {
        return {
            status: 404,
            body: {
                message: 'Il y a eu une erreur lors de la création du modèle, veuillez réessayer.'
            }
        }
    }

    return {
        status: 200,
        body: {
            message: 'Modèle créé avec succès.',
        }
    }
});