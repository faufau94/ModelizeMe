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

  const result = await prisma.model.deleteMany({
    where: {
      id: { in: ids },
    },
  })

  return { success: true, count: result.count }
})
