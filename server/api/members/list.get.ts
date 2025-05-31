import { getServerSession } from '#auth'
import prisma from "~/lib/prisma"

export default defineEventHandler(async event => {
  // Fetch current user session
  const session = await getServerSession(event)
  const userId = session?.user?.id
  if (!userId) {
    return { status: 401, body: { message: 'Unauthorized' } }
  }

  // Get workspaceId from query
  const { workspaceId } = getQuery(event)
  if (!workspaceId) {
    return { status: 400, body: { message: 'workspaceId is required' } }
  }

  try {

    // Retrieve owner of the workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: String(workspaceId) },
      include: { owner: true }
    })
    
    // Retrieve members of the workspace
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: String(workspaceId) },
      include: {
        user: {
          include: {
            teamMemberships: {
              where: { team: { workspaceId: String(workspaceId) } },
              include: {
                team: true
              }
            }
          }
        },
        role: {
          select: { name: true }
        }
      }
    })

    
    const allMembers = [
      {
        userId: workspace?.ownerId,
        workspaceId: workspace?.id,
        canViewAllTeams: true,
        user: workspace?.owner,
        role:{
         name:"OWNER"
        }
      },
      ...members
    ]

    return allMembers
  } catch (error) {
    return { status: 500, body: { message: 'Error fetching members' } }
  }
})
