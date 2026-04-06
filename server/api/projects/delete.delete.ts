import prisma from "~/lib/prisma";
import { requireOrgMembership } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event);
  const projectId = idSchema.parse(id);

  const project = await prisma.generatedProject.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw createError({ statusCode: 404, message: "Projet introuvable" });
  }

  await requireOrgMembership(event, project.workspaceId);

  await prisma.generatedProject.delete({ where: { id: projectId } });

  return { success: true };
});
