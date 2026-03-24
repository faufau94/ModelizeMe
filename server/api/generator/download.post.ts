import { requireAuth } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const body = await readBody(event);
  const { projectName } = body;

  if (!projectName || typeof projectName !== "string") {
    throw createError({ statusCode: 400, message: "projectName requis" });
  }

  return await $fetch(process.env.URL_BACKEND + "/api/download-project", {
    method: "POST",
    body: { projectName },
    responseType: "blob",
  });
});
