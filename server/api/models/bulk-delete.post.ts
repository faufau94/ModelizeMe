import prisma from "~/lib/prisma"
import { requireAuth } from "~/server/utils/auth"
import { bulkDeleteModelsSchema } from "~/server/validators"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const body = await readBody(event)

  const { ids } = bulkDeleteModelsSchema.parse(body)

  if (!ids.length) {
    return { success: true, count: 0 }
  }

  // Verify user has access to ALL models (must be member of each model's workspace)
  const models = await prisma.model.findMany({
    where: { id: { in: ids } },
    select: { id: true, workspaceId: true, authorId: true },
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
    select: { organizationId: true, role: true },
  })

  const membershipMap = new Map(memberships.map((m) => [m.organizationId, m.role]))

  // Check access to all workspaces
  if (workspaceIds.some((wsId) => !membershipMap.has(wsId))) {
    throw createError({ statusCode: 403, message: "Vous n'avez pas accès à un ou plusieurs de ces modèles" })
  }

  // For each model, user must be owner/admin of workspace OR author of the model
  for (const model of models) {
    const role = membershipMap.get(model.workspaceId)
    const isOwnerOrAdmin = role === "owner" || role === "admin"
    const isAuthor = model.authorId === session.user.id

    if (!isOwnerOrAdmin && !isAuthor) {
      throw createError({
        statusCode: 403,
        message: "Vous ne pouvez supprimer que vos propres modèles ou ceux de vos workspaces en tant qu'admin",
      })
    }
  }

  const result = await prisma.model.deleteMany({
    where: {
      id: { in: ids },
    },
  })

  return { success: true, count: result.count }
})
