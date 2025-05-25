import { getServerSession } from '#auth'
import prisma from '~/lib/prisma'

export default defineEventHandler(async event => {
  // Validate session
  const session = await getServerSession(event)
  if (!session?.user?.id) {
    return { status: 401, body: { message: 'Unauthorized' } }
  }

  // Get user id
  const { id } = getQuery(event)
  if (!id) {
    return { status: 400, body: { message: 'User id is required' } }
  }

  try {
    // Delete user
    await prisma.user.delete({ where: { id: Number(id) } })
    return { status: 200, body: { message: `User ${id} deleted successfully` } }
  } catch (error) {
    return { status: 500, body: { message: 'Error deleting user' } }
  }
})
