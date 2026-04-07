import { requireModelAccess } from '~/server/utils/auth'
import { unregisterViewer } from '~/server/utils/model-viewers'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { modelId, userId } = body

  if (!modelId || !userId) {
    throw createError({ statusCode: 400, message: 'modelId and userId are required' })
  }

  // Verify user has access to this model's workspace
  await requireModelAccess(event, modelId)

  unregisterViewer(modelId, userId)
  return { ok: true }
})
