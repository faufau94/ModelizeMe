import prisma from "~/lib/prisma";
import nodemailer from 'nodemailer';

export default defineEventHandler(async event => {

    const body = await readBody(event);
    const { joinCode, userId, userEmail, url } = body;

    console.log('userEmail', userEmail);
    

    if (!joinCode || !userId) {
        return {
            status: 404,
            body: {
                message: 'Impossible de créer la classe, veuillez réessayer'
            }
        }
    }

    const classCreated = await prisma.class.create({
        data: {
            name: joinCode,
            joinCode: joinCode,
            ownerId: userId
        }
    });

    if (!classCreated) {
        return {
            status: 404,
            body: {
                message: 'Il y a eu une erreur lors de la création de la classe'
            }
        }
    }

    // TODO : send email to user

    const transporter = nodemailer.createTransport({
        host: 'in-v3.mailjet.com',
        port: 587,
        auth: {
            user: 'c1e5fb67e5770d386b6d5c03776f35fc',
            pass: '1b468458e81e6b44423c228efb08bb3c',
        }
    });

    let res = await transporter.sendMail({
        from: "faudelh94@hotmail.fr", // sender address
        to: userEmail, // list of receivers
        subject: "Nouvelle classe", // Subject line
        text: "Nouvelle classe", // plain text body
        connectionTimeout: 30000,   // 30 seconds
        greetingTimeout: 30000,     // 30 seconds
        socketTimeout: 30000,
        html: `
        <h1>Bonjour,</h1>
        <p>Voici le lien: ${url}</p>
        `
    });


    return {
        status: 200,
        body: {
            message: `Classe "${classCreated}" créée avec succès`,
        }
    }


    
});