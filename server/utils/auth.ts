import type { H3Event } from "h3";
import { auth } from "~/lib/auth";
import prisma from "~/lib/prisma";

/**
 * Requires an authenticated session. Throws 401 if not authenticated.
 * Returns the session object with user data.
 */
export async function requireAuth(event: H3Event) {
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      message: "Non authentifié",
    });
  }

  return session;
}

/**
 * Requires admin role. Throws 403 if not admin.
 */
export async function requireAdmin(event: H3Event) {
  const session = await requireAuth(event);

  if (session.user.role !== "admin") {
    throw createError({
      statusCode: 403,
      message: "Accès réservé aux administrateurs",
    });
  }

  return session;
}

/**
 * Requires that the authenticated user is a member of the given organization.
 * Returns the member record.
 */
export async function requireOrgMembership(event: H3Event, organizationId: string) {
  const session = await requireAuth(event);

  const member = await prisma.member.findFirst({
    where: {
      organizationId,
      userId: session.user.id,
    },
  });

  if (!member) {
    throw createError({
      statusCode: 403,
      message: "Vous n'êtes pas membre de cette organisation",
    });
  }

  return { session, member };
}

/**
 * Requires that the authenticated user is a member of the given team.
 * Returns the team member record.
 */
export async function requireTeamMembership(event: H3Event, teamId: string) {
  const session = await requireAuth(event);

  const teamMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: session.user.id,
      },
    },
  });

  if (!teamMember) {
    throw createError({
      statusCode: 403,
      message: "Vous n'êtes pas membre de cette équipe",
    });
  }

  return { session, teamMember };
}

/**
 * Requires that the authenticated user has one of the specified roles in the given organization.
 * Returns { session, member }.
 */
export async function requireOrgRole(
  event: H3Event,
  organizationId: string,
  allowedRoles: string[]
) {
  const session = await requireAuth(event);

  const member = await prisma.member.findFirst({
    where: {
      organizationId,
      userId: session.user.id,
    },
  });

  if (!member) {
    throw createError({
      statusCode: 403,
      message: "Vous n'êtes pas membre de cette organisation",
    });
  }

  if (!allowedRoles.includes(member.role)) {
    throw createError({
      statusCode: 403,
      message: "Vous n'avez pas les permissions nécessaires",
    });
  }

  return { session, member };
}

/**
 * Resolves a team's organizationId then checks membership + role.
 * Returns { session, member, team }.
 */
export async function requireTeamOrgRole(
  event: H3Event,
  teamId: string,
  allowedRoles: string[]
) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, organizationId: true },
  });

  if (!team) {
    throw createError({
      statusCode: 404,
      message: "Équipe non trouvée",
    });
  }

  const { session, member } = await requireOrgRole(event, team.organizationId, allowedRoles);
  return { session, member, team };
}

/**
 * Resolves a team's organizationId then checks org membership (any role).
 * Returns { session, member, team }.
 */
export async function requireTeamOrgMembership(event: H3Event, teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, organizationId: true },
  });

  if (!team) {
    throw createError({
      statusCode: 404,
      message: "Équipe non trouvée",
    });
  }

  const { session, member } = await requireOrgMembership(event, team.organizationId);
  return { session, member, team };
}

/**
 * Requires that the authenticated user owns the model (is member of the model's workspace).
 * Returns the model.
 */
export async function requireModelAccess(event: H3Event, modelId: string) {
  const session = await requireAuth(event);

  const model = await prisma.model.findUnique({
    where: { id: modelId },
    select: { id: true, workspaceId: true, teamId: true, authorId: true },
  });

  if (!model) {
    throw createError({
      statusCode: 404,
      message: "Modèle non trouvé",
    });
  }

  // Check org membership
  const member = await prisma.member.findFirst({
    where: {
      organizationId: model.workspaceId,
      userId: session.user.id,
    },
  });

  if (!member) {
    throw createError({
      statusCode: 403,
      message: "Vous n'avez pas accès à ce modèle",
    });
  }

  return { session, model, member };
}
