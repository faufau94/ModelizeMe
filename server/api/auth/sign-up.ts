import prisma from "../../../lib/prisma";
import bcrypt from "bcrypt";

export default defineEventHandler(async event => {
    const { name, firstName, email, password } = await readBody(event);



    const existingUser = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });

    if (!existingUser) {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Créer un nouvel utilisateur s'il n'existe pas
        await prisma.user.create({
            data: {
                email: email,
                name: name,
                first_name: firstName,
                password: hashedPassword,
            },
        });

        return {
            status: 200,
            body: {
                message: 'Votre compte a été créé avec succès'
            }
        }
    }

    return {
        status: 400,
        body: {
            error: "Cet utilisateur existe déjà"
        }
    }


})