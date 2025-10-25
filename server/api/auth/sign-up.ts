import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import nodemailer from 'nodemailer';

export default defineEventHandler(async event => {
    console.log("saluuut")
    const { name, firstName, email, password, isFromAdmin } = await readBody(event);

    const existingUser = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });

    if (!existingUser) {
            console.log('Creating new user:', email);
        const hashedPassword = await bcrypt.hash(password, 10);
        // Créer un nouvel utilisateur s'il n'existe pas
        const user = await prisma.user.create({
            data: {
                email: email,
                name: name,
                first_name: firstName,
                password: hashedPassword,
                role: { connect: { name: "USER" } },
            },
        });
        console.log('Creating new user 2:', email);
        // créer un workspace par défaut
        const workspace = await prisma.workspace.create({
            data: {
                name: "First workspace",
                owner: {
                    connect: { id: user.id }
                },
            }
        });
        console.log('Creating new user 3:', email);
        // add lastActiveWorkspaceId to user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                lastActiveWorkspaceId: workspace.id
            },
        })
        
        console.log('Creating new user 4:', email);
        if(user && workspace) {
            console.log('User and workspace created successfully:', user, workspace);
            if(isFromAdmin) {
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
                    to: email, // list of receivers
                    subject: "Compte créé", // Subject line
                    text: "Compte créé", // plain text body
                    connectionTimeout: 30000,   // 30 seconds
                    greetingTimeout: 30000,     // 30 seconds
                    socketTimeout: 30000,
                    html: `
                    <h1>Bonjour,</h1>
                    <p>Votre compte a été créé avec succès.</p>
                    <p>Votre mot de passe: ${password}</p>
                    `
                });
            }

            return {
                status: 200,
                body: {
                    user: user,
                    message: 'Votre compte a été créé avec succès'
                }
            }
        } else {
            return {
                status: 400,
                body: {
                    message: 'Il y a eu un problème lors de la création de votre compte'
                }
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