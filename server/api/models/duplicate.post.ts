import prisma from "~/lib/prisma"
import { requireAuth, requireOrgMembership } from "~/server/utils/auth"
import { z } from "zod"

const schema = z.object({
  modelId: z.string().min(1),
  targetWorkspaceId: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const { modelId, targetWorkspaceId } = schema.parse(body)

  const original = await prisma.model.findUnique({ where: { id: modelId } })
  if (!original) throw createError({ statusCode: 404, message: "Modèle introuvable" })

  // Ensure user is a member of the source workspace
  await requireOrgMembership(event, original.workspaceId)

  // If duplicating to a different workspace, verify membership there too
  const destinationWorkspaceId = targetWorkspaceId || original.workspaceId
  if (targetWorkspaceId && targetWorkspaceId !== original.workspaceId) {
    await requireOrgMembership(event, targetWorkspaceId)
  }

  const duplicate = await prisma.model.create({
    data: {
      name: `${original.name} (copie)`,
      description: original.description,
      type: original.type,
      nodes: original.nodes,
      edges: original.edges,
      workspaceId: destinationWorkspaceId,
      authorId: user.id,
    },
  })

  return duplicate
})
