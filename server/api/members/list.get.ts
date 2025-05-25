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
    // Retrieve members of the workspace
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: String(workspaceId) },
      include: {
        user: { select: { id: true, email: true, first_name: true, name: true, image: true } }
      }
    })

    return members
  } catch (error) {
    return { status: 500, body: { message: 'Error fetching members' } }
  }
})
