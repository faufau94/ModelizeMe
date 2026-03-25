import prisma from "~/lib/prisma"
import { requireAuth } from "~/server/utils/auth"
import { bulkDeleteModelsSchema } from "~/server/validators"

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  
  const { ids } = bulkDeleteModelsSchema.parse(body)

  if (!ids.length) {
    return { success: true, count: 0 }
  }

  const result = await prisma.model.deleteMany({
    where: {
      id: {
        in: ids
      },
      // Optionally restrict to workspace boundaries if strict auth is needed
    }
  })

  return { success: true, count: result.count }
})
