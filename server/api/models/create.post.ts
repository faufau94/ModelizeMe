import prisma from "~/lib/prisma";
import { requireAuth, requireOrgMembership } from "~/server/utils/auth";
import { createModelSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { title, selectedWorkspaceId } = createModelSchema.parse(body);

  const { session } = await requireOrgMembership(event, selectedWorkspaceId);

  const newModel = await prisma.model.create({
    data: {
      name: title,
      author: { connect: { id: session.user.id } },
      workspace: { connect: { id: selectedWorkspaceId } },
    },
  });

  if (!newModel) {
    throw createError({
      statusCode: 500,
      message: "Erreur lors de la création du modèle",
    });
  }

  return newModel;
});
