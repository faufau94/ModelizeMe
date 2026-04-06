import prisma from "~/lib/prisma";
import { requireOrgMembership } from "~/server/utils/auth";
import { idSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event);
  const projectId = idSchema.parse(id);

  const project = await prisma.generatedProject.findUnique({
    where: { id: projectId },
    include: {
      model: { select: { id: true, name: true } },
      author: { select: { name: true, image: true } },
    },
  });

  if (!project) {
    throw createError({ statusCode: 404, message: "Projet introuvable" });
  }

  await requireOrgMembership(event, project.workspaceId);

  return project;
});
