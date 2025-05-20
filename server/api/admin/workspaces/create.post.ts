import prisma from "~/lib/prisma";
import nodemailer from 'nodemailer';

export default defineEventHandler(async event => {

    const body = await readBody(event);
    const { inviteCode, userId, userEmail, url } = body;
    

    if (!inviteCode || !userId) {
        return {
            status: 404,
            body: {
                message: 'Impossible de créer le workspace, veuillez réessayer'
            }
        }
    }

    const workspaceCreated = await prisma.workspace.create({
        data: {
            name: inviteCode,
            ownerId: userId
        }
    });

    if (!workspaceCreated) {
        return {
            status: 404,
            body: {
                message: 'Il y a eu une erreur lors de la création du workspace, veuillez réessayer'
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
        subject: "Nouveau workspace créé", // Subject line
        text: "Nouveau workspace créé", // plain text body
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
            message: `Workspace "${workspaceCreated}" créée avec succès`,
        }
    }


    
});