import { auth } from '~/lib/auth'
import prisma from '~/lib/prisma'

export default defineEventHandler(async event => {
  console.log('DELETE MEMBER API CALLED')
  // Validate session
  const session = await auth.api.getSession({
    headers: event.headers,
  })
  if (!session?.user?.id) {
    return { status: 401, body: { message: 'Unauthorized' } }
  }

  // Get user id
  const { userId, workspaceId } = getQuery(event)
  if (!userId) {
    return { status: 400, body: { message: 'User id is required' } }
  }

  console.log('Deleting user with id:', userId)
  console.log('Workspace ID:', workspaceId)
  // Validate workspaceId
  try {
    // Delete user
    const member = await prisma.workspaceMember.delete({ 
      where: { 
        userId_workspaceId: { 
          userId: Number(userId), 
          workspaceId: String(workspaceId) 
        } 
      }
     })

     
    if (!member) {
      return {
        status: 404,
        body: { message: `No member found with userId ${userId} in workspace ${workspaceId}` },
      }
    }
    return { status: 200, body: { message: `User deleted successfully` } }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { status: 500, body: { message: 'Error deleting user' } }
  }
})
