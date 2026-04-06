import prisma from "~/lib/prisma"
import { requireAuth } from "~/server/utils/auth"
import { bulkCopyModelsSchema } from "~/server/validators"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const body = await readBody(event)

  const { ids, targetWorkspaceId } = bulkCopyModelsSchema.parse(body)

  if (!ids.length) {
    return { success: true, count: 0 }
  }

  if (ids.length > 20) {
    throw createError({ statusCode: 400, message: "Maximum 20 modèles à copier en même temps" })
  }

  // Fetch full models
  const models = await prisma.model.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, nodes: true, edges: true, workspaceId: true },
  })

  if (models.length !== ids.length) {
    throw createError({ statusCode: 404, message: "Un ou plusieurs modèles introuvables" })
  }

  // Verify access to source models
  const sourceWorkspaceIds = [...new Set(models.map((m) => m.workspaceId))]

  const memberships = await prisma.member.findMany({
    where: {
      userId: session.user.id,
      organizationId: { in: [...sourceWorkspaceIds, targetWorkspaceId] },
    },
    select: { organizationId: true },
  })

  const memberWorkspaceIds = new Set(memberships.map((m) => m.organizationId))

  if (sourceWorkspaceIds.some((wsId) => !memberWorkspaceIds.has(wsId))) {
    throw createError({ statusCode: 403, message: "Vous n'avez pas accès à un ou plusieurs de ces modèles" })
  }

  if (!memberWorkspaceIds.has(targetWorkspaceId)) {
    throw createError({ statusCode: 403, message: "Vous n'avez pas accès au workspace de destination" })
  }

  // Create copies in target workspace
  const copies = await prisma.$transaction(
    models.map((model) =>
      prisma.model.create({
        data: {
          name: `${model.name} (copie)`,
          nodes: model.nodes as any,
          edges: model.edges as any,
          workspaceId: targetWorkspaceId,
          teamId: null,
          authorId: session.user.id,
        },
      })
    )
  )

  return { success: true, count: copies.length }
})
