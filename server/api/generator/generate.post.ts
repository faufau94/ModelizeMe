import { requireAuth } from "~/server/utils/auth";
import { generateSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const body = await readBody(event);
  const { title, framework, database, orm, nodes, edges } = generateSchema.parse(body);

  const mld = { nodes, edges };

  const response = await $fetch(process.env.URL_BACKEND + "/api/generate-project", {
    method: "POST",
    body: {
      title: title.replace(/ /g, "-"),
      framework,
      database,
      orm,
      mld,
    },
  });

  if ((response as any).status === "success") {
    return { projectName: (response as any).projectName };
  }

  throw createError({
    statusCode: 400,
    message: "Erreur lors de la génération du projet",
  });
});
