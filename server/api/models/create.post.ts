import prisma from "~/lib/prisma";
import { auth } from "~/lib/auth";

export default defineEventHandler(async event => {

    const { title, selectedWorkspaceId } = await readBody(event);

    const session = await auth.api.getSession({
        headers: event.headers,
    })

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