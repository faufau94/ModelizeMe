// server/api/workspaces/list.get.ts
import prisma from "~/lib/prisma"
import { getServerSession } from "#auth"

export default defineEventHandler(async (event) => {
  // 1) Récupère l’ID utilisateur depuis la session
  const session = await getServerSession(event)
  const userId  = session?.user?.id
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: "Non authentifié" })
  }

  // 2) Récupère les workspaces où il est owner OR membre
  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
      ]
    },
    include: {
      owner: true,               // toujours inclure l’owner
      members: {
        where: { userId },       // ne garder que votre ligne de membership
        select: {
          role: true,
          canViewAllTeams: true
        }
      }
    },
    orderBy: { name: "asc" }
  })

  return workspaces
})