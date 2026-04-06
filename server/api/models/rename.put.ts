import prisma from "~/lib/prisma";
import { requireModelAccess } from "~/server/utils/auth";
import { idSchema, renameModelSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const modelId = idSchema.parse(query.id);
  const body = await readBody(event);
  const { name } = renameModelSchema.parse(body);

  await requireModelAccess(event, modelId);

  return await prisma.model.update({
    where: { id: modelId },
    data: { name },
  });
});
