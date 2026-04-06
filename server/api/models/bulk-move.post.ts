import prisma from "~/lib/prisma"
import { requireAuth } from "~/server/utils/auth"
import { bulkMoveModelsSchema } from "~/server/validators"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const body = await readBody(event)

  const { ids, teamId } = bulkMoveModelsSchema.parse(body)

  if (!ids.length) {
    return { success: true, count: 0 }
  }

  // Verify user has access to ALL models
  const models = await prisma.model.findMany({
    where: { id: { in: ids } },
    select: { id: true, workspaceId: true },
  })

  if (models.length !== ids.length) {
    throw createError({ statusCode: 404, message: "Un ou plusieurs modèles introuvables" })
  }

  const workspaceIds = [...new Set(models.map((m) => m.workspaceId))]

  const memberships = await prisma.member.findMany({
    where: {
      userId: session.user.id,
      organizationId: { in: workspaceIds },
    },
    select: { organizationId: true },
  })

  const memberWorkspaceIds = new Set(memberships.map((m) => m.organizationId))

  if (workspaceIds.some((wsId) => !memberWorkspaceIds.has(wsId))) {
    throw createError({ statusCode: 403, message: "Vous n'avez pas accès à un ou plusieurs de ces modèles" })
  }

  // If teamId is provided, verify team exists and belongs to same workspace
  if (teamId) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, organizationId: true },
    })

    if (!team) {
      throw createError({ statusCode: 404, message: "Équipe introuvable" })
    }

    if (!memberWorkspaceIds.has(team.organizationId)) {
      throw createError({ statusCode: 403, message: "Vous n'avez pas accès à cette équipe" })
    }
  }

  const result = await prisma.model.updateMany({
    where: { id: { in: ids } },
    data: { teamId: teamId || null },
  })

  return { success: true, count: result.count }
})
