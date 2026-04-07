import { requireAuth } from '~/server/utils/auth'
import { getViewersForModels } from '~/server/utils/model-viewers'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const { modelIds } = getQuery(event)

  if (!modelIds || typeof modelIds !== 'string') {
    return {}
  }

  const ids = modelIds.split(',').filter(Boolean)
  return getViewersForModels(ids)
})
