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
    // Update user fields
    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        email: data.email,
        first_name: data.first_name,
        name: data.name,
        image: data.image,
        roleId: data.roleId ? Number(data.roleId) : undefined
      },
      select: { id: true, email: true }
    })
    return { status: 200, body: { updated, message: `User "${updated.email}" updated successfully` } }
  } catch (error) {
    return { status: 500, body: { message: 'Error updating user' } }
  }
})