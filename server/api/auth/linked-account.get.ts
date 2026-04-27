import { requireAuth } from "~/server/utils/auth";
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);

  const query = getQuery(event);
  const provider = query.provider as string;

  if (!provider || !["github", "gitlab", "google"].includes(provider)) {
    throw createError({ statusCode: 400, message: "Provider invalide" });
  }

  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: provider,
    },
    select: { id: true },
  });

  return { linked: !!account };
});
