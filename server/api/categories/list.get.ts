import prisma from "~/lib/prisma";
import { requireAuth } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  return await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
});
