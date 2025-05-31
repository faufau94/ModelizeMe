import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "~/prisma/generated/prisma/client";
import { admin } from "better-auth/plugins";
import { organization } from "better-auth/plugins";
// import { useRuntimeConfig } from "#imports";

const prisma = new PrismaClient();
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mysql",
    }),
    emailAndPassword: {  
        enabled: true,
        autoSignIn: false,
        async sendResetPassword(url, user) {
			console.log("Reset password url:", url);
		},
    },
    // socialProviders: { 
    //     google: { 
    //        clientId: useRuntimeConfig().googleClientId  || "", 
    //        clientSecret: useRuntimeConfig().googleClientSecret  || "", 
    //     },
    //     github: { 
    //        clientId: useRuntimeConfig().githubClientId  || "", 
    //        clientSecret: useRuntimeConfig().githubClientSecret  || "", 
    //     },
    //     gitlab: { 
    //        clientId: useRuntimeConfig().gitlabClientId  || "", 
    //        clientSecret: useRuntimeConfig().gitlabClientSecret  || "", 
    //     },
    // },
    plugins: [
        admin(),
        organization()
    ],
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    // Create a default organization for the new user
                    const org = await auth.api.createOrganization({
                        body: {
                            name: `${user.name}'s Workspace`,
                            slug: `${user.name.toLowerCase().replace(/\s+/g, '-')}-wp`,
                            userId: user.id,
                        },
                    });
                },
            },
        },
        
        session: {
            create: {
              before: async (session) => {
                // 1. Rechercher la dernière session précédente
                const lastSession = await prisma.session.findFirst({
                  where: {
                    userId: session.userId,
                  },
                  orderBy: {
                    createdAt: 'desc',
                  },
                });
          
                let activeOrganizationId = lastSession?.activeOrganizationId;
          
                // 2. Sinon, prendre la première organisation liée
                if (!activeOrganizationId) {
                  const firstOrg = await prisma.organization.findFirst({
                    where: {
                      members: { some: { userId: session.userId } },
                    },
                    orderBy: { createdAt: 'asc' },
                  });
          
                  if (!firstOrg) throw new Error('No organization found');
          
                  activeOrganizationId = firstOrg.id;
                }
          
                return {
                  data: {
                    ...session,
                    activeOrganizationId,
                  },
                };
              },
            },
          },
          
          
    },
});