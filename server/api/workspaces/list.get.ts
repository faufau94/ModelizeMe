// server/api/workspaces/list.get.ts
import prisma from "~/lib/prisma"
import { auth } from "~/lib/auth"

export default defineEventHandler(async (event) => {
  // 1) Récupère l’ID utilisateur depuis la session
  const session = await auth.api.getSession({
    headers: event.headers,
  })
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
    orderBy: { createdAt: "asc" }
  })

  return workspaces
})