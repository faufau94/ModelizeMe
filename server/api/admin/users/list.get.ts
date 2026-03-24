import prisma from "~/lib/prisma";
import { requireAdmin } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      banReason: true,
      banExpires: true,
      createdAt: true,
      image: true,
    },
    orderBy: { createdAt: "desc" },
  });
});
