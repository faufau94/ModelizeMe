import { requireAuth } from "~/server/utils/auth";
import { generateFileSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const body = await readBody(event);
  const { title, database, nodes, edges } = generateFileSchema.parse(body);

  const mld = { nodes, edges };

  return await $fetch(process.env.URL_BACKEND + "/api/generate-file", {
    method: "POST",
    body: { title, database, mld },
    responseType: "blob",
  });
});
