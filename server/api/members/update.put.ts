import { getServerSession } from '#auth'
import prisma from '~/lib/prisma'

export default defineEventHandler(async event => {
  // Validate session
  const session = await getServerSession(event)
  if (!session?.user?.id) {
    return { status: 401, body: { message: 'Unauthorized' } }
  }

  // Get user id and body
  const { id } = getQuery(event)
  const data = await readBody(event)
  if (!id) {
    return { status: 400, body: { message: 'User id is required' } }
  }

  try {
    console.log('Updating user with id:', id, 'and data:', data)
    // Update user fields
    const updated = await prisma.workspaceMember.update({
      where: { id: Number(id) },
      data: data
    })

    return { status: 200, body: { updated, message: `User "${updated.email}" updated successfully` } }
  } catch (error) {
    return { status: 500, body: { message: 'Error updating user' } }
  }
})