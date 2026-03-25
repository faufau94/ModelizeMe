import { getViewersForModels } from '~/server/utils/model-viewers'

export default defineEventHandler(async (event) => {
  const { modelIds } = getQuery(event)

  if (!modelIds || typeof modelIds !== 'string') {
    return {}
  }

  const ids = modelIds.split(',').filter(Boolean)
  return getViewersForModels(ids)
})
