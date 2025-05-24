import prisma from "@/lib/prisma";

export default defineEventHandler(async (event) => {
  const { email } = getQuery(event)
  const u = await prisma.user.findUnique({ where: { email: String(email) } })
  return {
    body: {
        exists: !!u,
      },
   }
})
