import { requireAuth } from "~/server/utils/auth";
import { auth } from "~/lib/auth";

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);

  const body = await readBody(event);
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim().length < 1) {
    throw createError({
      statusCode: 400,
      message: "Le nom de l'organisation est requis",
    });
  }

  // Use better-auth's organization API to create the org
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const org = await auth.api.createOrganization({
    body: {
      name: name.trim(),
      slug: `${slug}-${Date.now()}`,
      userId: session.user.id,
    },
  });

  return org;
});
