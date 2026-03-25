import { registerViewer } from '~/server/utils/model-viewers'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { modelId, userId, userName, userImage } = body

  if (!modelId || !userId) {
    throw createError({ statusCode: 400, message: 'modelId and userId are required' })
  }

  registerViewer(modelId, userId, userName, userImage)
  return { ok: true }
})
