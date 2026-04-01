import { requireAuth } from "~/server/utils/auth";
import { projectNameSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const body = await readBody(event);
  const projectName = projectNameSchema.parse(body?.projectName);

  return await $fetch(process.env.URL_BACKEND + "/api/download-project", {
    method: "POST",
    body: { projectName },
    responseType: "blob",
  });
});
