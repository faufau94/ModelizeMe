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
      owner: true,
      members: {
        where: { userId },
        select: {
          canViewAllTeams: true,
          role: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: { name: "asc" }
  })

  return workspaces
})