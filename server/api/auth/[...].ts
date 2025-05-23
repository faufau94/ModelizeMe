import GithubProvider from 'next-auth/providers/github'
import GitlabProvider from 'next-auth/providers/gitlab'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from "next-auth/providers/credentials"
import { NuxtAuthHandler } from '#auth'
import prisma from "~/lib/prisma";
import bcrypt from "bcrypt";

export default NuxtAuthHandler({
    // A secret string you define, to ensure correct encryption
    secret: useRuntimeConfig().authSecret,
    providers: [
        CredentialsProvider.default({
            // The name to display on the sign in form (e.g. 'Sign in with...')
            name: 'vos informations',
            // The credentials is used to generate a suitable form on the sign in page.
            // You can specify whatever fields you are expecting to be submitted.
            // e.g. domain, username, password, 2FA token, etc.
            // You can pass any HTML attribute to the <input> tag through the object.
            credentials: {
                email: { label: "Email", type: "text", placeholder: "" },
                password: { label: "Mot de passe", type: "password" }
            },
            async authorize(credentials, req) {
                // You need to provide your own logic here that takes the credentials
                // submitted and returns either an object representing a user or value
                // that is false/null if the credentials are invalid.
                // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
                // You can also use the `req` object to obtain additional parameters
                // (i.e., the request IP address)
                const user = await prisma.user.findFirst({
                    where: {
                        email: credentials.email,
                    },
                    include: {
                        role: true
                    }
                })
                // Vérifier si l'utilisateur existe et si le mot de passe est correct
                if (!user) {
                    return {
                        status : "error",
                        message: "Cet email n'existe pas."
                    }
                }


                // Vérifier le mot de passe
                const credentialhashedPassword = await bcrypt.compare(credentials.password, user.password);
                if(!credentialhashedPassword) {
                    return {
                        status : "error",
                        message: "Mot de passe incorrect."
                    }
                }
                return user
            }
        }),
        // @ts-expect-error Use .default here for it to work during SSR.
        GoogleProvider.default({
            clientId: useRuntimeConfig().googleClientId,
            clientSecret: useRuntimeConfig().googleClientSecret
        }),

        GithubProvider.default({
            clientId: useRuntimeConfig().githubClientId,
            clientSecret: useRuntimeConfig().githubClientSecret
        }),

        GitlabProvider.default({
            clientId: useRuntimeConfig().gitlabClientId,
            clientSecret: useRuntimeConfig().gitlabClientSecret
        }),


    ],
    callbacks: {
        /* on before signin */
        async signIn({ user, account, profile, email, credentials }) {
            if (account.provider !== 'credentials') {
                const providerId = account.providerAccountId;

                // Vérifier si un utilisateur existe déjà avec cet email
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                    include: { linkedAccounts: true }, // Inclure les comptes liés
                });

                if (!existingUser) {
                    // Créer un nouvel utilisateur si l'utilisateur n'existe pas
                    await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name,
                            first_name: user?.name,
                            image: user.picture || user.avatar_url,
                            linkedAccounts: {
                                create: {
                                    provider: account.provider,
                                    providerId: providerId,
                                    accessToken: account.access_token,
                                    refreshToken: account.refresh_token || null,
                                    username: profile?.login || user.email,
                                },
                            },
                        },
                    });
                } else {
                    // Si l'utilisateur existe déjà, vérifier s'il a déjà ce provider lié
                    const linkedAccount = existingUser.linkedAccounts.find(
                        acc => acc.provider === account.provider && acc.providerId === providerId
                    );

                    if (!linkedAccount) {
                        // Ajouter un nouveau compte lié si ce provider n'est pas encore associé à l'utilisateur
                        await prisma.linkedAccount.create({
                            data: {
                                userId: existingUser.id,
                                provider: account.provider,
                                providerId: providerId,
                                accessToken: account.access_token,
                                refreshToken: account.refresh_token || null,
                                username: profile?.login || user.email,
                            },
                        });
                    } else {
                        // Si le compte lié existe déjà, mettre à jour les jetons d'accès (optionnel)
                        await prisma.linkedAccount.update({
                            where: {
                                id: linkedAccount.id,
                            },
                            data: {
                                accessToken: account.access_token,
                                refreshToken: account.refresh_token || null,
                                updatedAt: new Date(),
                            },
                        });
                    }
                }
            } else {
                
                // Gestion pour les utilisateurs qui se connectent avec email/password
                const existingUser = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                const isValid = await bcrypt.compare(credentials.password, existingUser.password)
                if (!isValid) {
                    // mauvais mot de passe
                    return null
                }

            
                if (existingUser) {
                    console.log('Mot de passe valide');
                    return existingUser;
                } else {
                    return null; // Mauvais email ou mot de passe
                }
            }

            // Retourner true pour permettre la connexion
            return true;
        },
        /* on session retrival */
        async session({ session, user, token }) {
            const source = user || token;

            if (source) {
                session.user = {
                    ...session.user,
                    id: source.id,
                    accounts: source.accounts || [],
                    role: source.role ?? null,
                    lastActiveWorkspaceId: source.lastActiveWorkspaceId || null,
                };

            }

            return session;
        },
        /* on JWT token creation or mutation */
        async jwt({ token, user, account, profile, isNewUser }) {

            if (user) {
                token.id = user.id
                token.role = user.role.name || []
                token.lastActiveWorkspaceId = user.lastActiveWorkspaceId
            }
            return token;
        }
    },
    events: {
        async linkAccount(message) {
            // Ici, message contient les informations sur l'utilisateur, le compte lié et le provider
        },
    },
})