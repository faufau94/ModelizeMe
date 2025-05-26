import { getServerSession } from '#auth'
import prisma from '~/lib/prisma'
import { hash } from 'bcrypt'

export default defineEventHandler(async event => {
  // Validate session
  const session = await getServerSession(event)
  if (!session?.user?.id) {
    return { status: 401, body: { message: 'Unauthorized' } }
  }

  // Parse request body
  const { email, password, first_name, name, roleId } = await readBody(event)
  if (!email || !password) {
    return { status: 400, body: { message: 'Email and password are required' } }
  }

  try {
    // Hash password and create user
    const hashed = await hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        first_name,
        name,
        role: { connect: { id: Number(roleId) } }
      },
      select: { id: true, email: true }
    })
    return { status: 200, body: { user, message: `User "${user.email}" created successfully` } }
  } catch (error) {
    return { status: 500, body: { message: 'Error creating user' } }
  }
})
