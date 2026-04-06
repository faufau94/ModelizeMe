import prisma from "~/lib/prisma";
import { requireAuth } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);

  // Get organizations where user is a member
  return await prisma.organization.findMany({
    where: {
      members: { some: { userId: session.user.id } },
    },
    include: {
      members: {
        where: { userId: session.user.id },
        select: {
          role: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
});
