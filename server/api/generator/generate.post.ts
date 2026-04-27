import { requireAuth } from "~/server/utils/auth";
import { generateSchema } from "~/server/validators";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const body = await readBody(event);
  const { title, framework, database, orm, nodes, edges, packages } = generateSchema.parse(body);

  // Validate that every node has a name — backend generators require it
  const unnamedNodes = nodes.filter((n: any) => !n?.data?.name || String(n.data.name).trim() === "");
  if (unnamedNodes.length > 0) {
    throw createError({
      statusCode: 400,
      message: `Votre modèle contient ${unnamedNodes.length} entité(s) sans nom. Nommez toutes vos entités avant de générer le projet.`,
    });
  }

  const mld = { nodes, edges };

  const response = await $fetch(process.env.URL_BACKEND + "/api/generate-project", {
    method: "POST",
    body: {
      title: title.replace(/ /g, "-"),
      framework,
      database,
      orm,
      mld,
      packages: packages ?? [],
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
