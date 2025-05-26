import prisma from "~/lib/prisma"
import { getServerSession } from "#auth"

export default defineEventHandler(async event => {

    console.log('Regenerating invite code for workspace')
  // Validate user session
  const session = await getServerSession(event)
  const userId = session?.user?.id
  if (!userId) {
    return { status: 401, body: { message: 'Unauthorized: User not authenticated' } }
  }

  // Extract workspaceId from query parameters
  const { workspaceId } = getQuery(event)
  if (!workspaceId) {
    return { status: 400, body: { message: 'workspaceId is required' } }
  }

  console.log(`User ${userId} is attempting to regenerate invite code for workspace ${workspaceId}`)

  // Fetch the workspace and verify ownership
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true }
  })

  console.log(`Fetched workspace: ${JSON.stringify(workspace)}`)


  if (!workspace) {
    return { status: 404, body: { message: 'Workspace not found' } }
  }
  if (workspace.ownerId !== userId) {
    return { status: 403, body: { message: 'Forbidden: Only the owner can regenerate the invite code' } }
  }


  try {
    console.log(`Regenerating invite code for workspace ${workspaceId} by user ${userId}`)
    // Generate a new invite code
    const { customAlphabet } = await import('nanoid')
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10)
    const newCode = nanoid()

    console.log(`Regenerating invite code for workspace ${workspaceId}: ${newCode}`)

    // Update the workspace record
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { inviteCode: newCode }
    })

    // Return the new code to the client
    return {
      status: 200,
      body: {
        inviteCode: newCode,
        message: 'Invite code regenerated successfully'
      }
    }
  } catch (error) {
    return { status: 500, body: { message: 'Error regenerating invite code, please try again' } }
  }
})