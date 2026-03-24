import { requireAuth } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const { provider, projectName, token } = await readBody(event);

  if (!provider || !projectName || !token) {
    throw createError({
      statusCode: 400,
      message: "provider, projectName et token sont requis",
    });
  }

  const headers: Record<string, string> = {
    Authorization: provider === "github" ? `token ${token}` : `Bearer ${token}`,
  };

  const body =
    provider === "github"
      ? { name: projectName, private: true }
      : { name: projectName, visibility: "private" };

  let response: any;

  switch (provider) {
    case "github":
      response = await $fetch("https://api.github.com/user/repos", {
        method: "POST",
        body,
        headers: { ...headers, Accept: "application/vnd.github.v3+json" },
      });
      break;
    case "gitlab":
      response = await $fetch("https://gitlab.com/api/v4/projects", {
        method: "POST",
        body,
        headers,
      });
      break;
    default:
      throw createError({ statusCode: 400, message: "Service non supporté" });
  }

  return {
    success: true,
    repoUrl: response.html_url || response.web_url,
  };
});
