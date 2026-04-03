import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";
import { admin } from "better-auth/plugins";
import { organization } from "better-auth/plugins";
import { sendOrganizationInvitation } from "@/lib/send-invitation";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    trustedOrigins: [
      process.env.BASE_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3100'
    ],
    database: prismaAdapter(prisma, {
        provider: "mysql",
    }),
    emailAndPassword: {  
        enabled: true,
        autoSignIn: true,
        async sendResetPassword(url, user) {
			// TODO: implement password reset email
		},
    },
    socialProviders: {
        google: {
           clientId: process.env.GOOGLE_CLIENT_ID || "",
           clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
        github: {
           clientId: process.env.GITHUB_CLIENT_ID || "",
           clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
           // Scope 'repo' required to create repos and push code
           scope: ["user:email", "repo"],
        },
        gitlab: {
           clientId: process.env.GITLAB_CLIENT_ID || "",
           clientSecret: process.env.GITLAB_CLIENT_SECRET || "",
           // Scope 'api' required for project creation + commits
           scope: ["read_user", "api"],
        },
    },
    plugins: [
        admin(),
        organization({
          teams: {
            enabled: true,
            allowRemovingAllTeams: true
          },
          organizationHooks: {
            afterCreateOrganization: async ({ organization }) => {
                // Remove teams created
                await prisma.team.deleteMany({
                    where: { organizationId: organization.id },
                });
            },
            beforeDeleteOrganization: async (data) => {
              // delete all models related to the organization
              await prisma.model.deleteMany({
                where: { workspaceId: data.organization.id },
              })
            },
          },

            schema: {
                team: {
                    additionalFields: {
                        // Add additional fields to the team table
                        description: {
                            type: "string",
                            input: true,
                            required: false,
                        },
                        color: {
                            type: "string",
                            input: true,
                            required: false,
                        },
                        maxMembers: {
                            type: "number",
                            input: true,
                            required: false,
                        }
                    },
                },
            },



          async sendInvitationEmail(data) {
            const baseUrl = useRuntimeConfig().public.baseUrl || "http://localhost:3000";
            const inviteLink = `${baseUrl}/app/workspace/join/${data.id}`;
            await sendOrganizationInvitation({
              email: data.email,
              invitedByUsername: data.inviter.user.name,
              invitedByEmail: data.inviter.user.email,
              teamName: data.organization.name,
              inviteLink
            });
          },

          
        })
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