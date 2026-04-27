import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";
import { admin } from "better-auth/plugins";
import { organization } from "better-auth/plugins";
import { sendOrganizationInvitation } from "@/lib/send-invitation";
import { sendEmail } from "@/lib/send-email";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3100',
    trustedOrigins: [
      process.env.BASE_URL || 'http://localhost:3100',
      'http://localhost:3100'
    ],
    database: prismaAdapter(prisma, {
        provider: "mysql",
    }),
    emailAndPassword: {  
        enabled: true,
        autoSignIn: false,
        requireEmailVerification: true,
        async sendResetPassword({ user, url }, request) {
            void sendEmail({
                to: user.email,
                subject: "Réinitialisation de votre mot de passe - ModelizeMe",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                        <div style="background: #4f46e5; color: white; padding: 24px 32px;">
                            <h2 style="margin: 0;">Réinitialisation de mot de passe</h2>
                        </div>
                        <div style="padding: 32px; background: #f9fafb;">
                            <p style="font-size: 16px; margin-bottom: 24px;">Bonjour <strong>${user.name}</strong>,</p>
                            <p style="font-size: 16px; margin-bottom: 24px;">Vous avez demandé une réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour continuer :</p>
                            <a href="${url}" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 18px; font-weight: bold; margin-bottom: 24px;">Réinitialiser mon mot de passe</a>
                            <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
                        </div>
                    </div>
                `,
            });
        },
        async onPasswordReset({ user }) {
            // User proved email ownership by clicking the reset link
            await prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: true },
            });
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        async sendVerificationEmail({ user, url }) {
            void sendEmail({
                to: user.email,
                subject: "Vérifiez votre adresse email - ModelizeMe",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                        <div style="background: #4f46e5; color: white; padding: 24px 32px;">
                            <h2 style="margin: 0;">Vérification de votre email</h2>
                        </div>
                        <div style="padding: 32px; background: #f9fafb;">
                            <p style="font-size: 16px; margin-bottom: 24px;">Bonjour <strong>${user.name}</strong>,</p>
                            <p style="font-size: 16px; margin-bottom: 24px;">Merci de vous être inscrit sur ModelizeMe ! Cliquez sur le bouton ci-dessous pour vérifier votre adresse email :</p>
                            <a href="${url}" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 18px; font-weight: bold; margin-bottom: 24px;">Vérifier mon email</a>
                            <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
                        </div>
                    </div>
                `,
            });
        },
    },
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google", "github", "gitlab"],
            allowDifferentEmails: true,
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
                    const suffix = user.id.slice(0, 8);
                    const slug = `${(user.name || 'user').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')}-${suffix}`;
                    try {
                        await auth.api.createOrganization({
                            body: {
                                name: `${user.name || 'Mon'}'s Workspace`,
                                slug,
                                userId: user.id,
                            },
                        });
                    } catch (e) {
                        // Retry with a unique fallback slug to prevent user lockout
                        const fallbackSlug = `workspace-${user.id.slice(0, 16)}`;
                        await auth.api.createOrganization({
                            body: {
                                name: `${user.name || 'Mon'}'s Workspace`,
                                slug: fallbackSlug,
                                userId: user.id,
                            },
                        });
                    }
                },
            },
        },
        
        session: {
            create: {
              before: async (session) => {
                // 1. Check the previous session for activeOrganizationId
                const lastSession = await prisma.session.findFirst({
                  where: {
                    userId: session.userId,
                  },
                  orderBy: {
                    createdAt: 'desc',
                  },
                });

                let activeOrganizationId = lastSession?.activeOrganizationId;

                // 2. Verify the org still exists and user is still a member
                if (activeOrganizationId) {
                  const stillMember = await prisma.member.findFirst({
                    where: { organizationId: activeOrganizationId, userId: session.userId },
                    select: { id: true },
                  });
                  if (!stillMember) activeOrganizationId = null;
                }

                // 3. Fallback: pick the first organization the user belongs to
                if (!activeOrganizationId) {
                  const firstOrg = await prisma.organization.findFirst({
                    where: {
                      members: { some: { userId: session.userId } },
                    },
                    orderBy: { createdAt: 'asc' },
                  });

                  activeOrganizationId = firstOrg?.id || null;
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