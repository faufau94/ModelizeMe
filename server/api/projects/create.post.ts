import prisma from "~/lib/prisma";
import { requireAuth } from "~/server/utils/auth";
import { requireOrgMembership } from "~/server/utils/auth";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  framework: z.string().min(1),
  orm: z.string().min(1),
  database: z.string().min(1),
  modelId: z.string().min(1),
  workspaceId: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);
  const body = await readBody(event);
  const data = createProjectSchema.parse(body);

  await requireOrgMembership(event, data.workspaceId);

  return await prisma.generatedProject.create({
    data: {
      name: data.name,
      description: data.description,
      framework: data.framework,
      orm: data.orm,
      database: data.database,
      modelId: data.modelId,
      workspaceId: data.workspaceId,
      authorId: session.user.id,
    },
  });
});
