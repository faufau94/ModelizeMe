import { auth } from '~/lib/auth'

export default defineEventHandler(async event => {
  // Validate session
  const session = await auth.api.getSession({
    headers: event.headers,
  })
  if (!session?.user?.id) {
    return { status: 401, body: { message: 'Unauthorized' } }
  }

  // Parse request body
  const { email } = await readBody(event)
  if (!email || !password) {
    return { status: 400, body: { message: 'Email and password are required' } }
  }

  try {
    // send invite email
    

  } catch (error) {
    
  }
})
