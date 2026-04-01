import { requireAuth } from "~/server/utils/auth";
import { z } from "zod";

const createRepoSchema = z.object({
  provider: z.enum(["github", "gitlab"]),
  projectName: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, "Nom de projet invalide"),
  branchName: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9._/-]+$/, "Nom de branche invalide"),
  token: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const body = await readBody(event);
  const { provider, projectName, branchName, token } =
    createRepoSchema.parse(body);

  const headers: Record<string, string> = {
    Authorization:
      provider === "github" ? `token ${token}` : `Bearer ${token}`,
  };

  const repoBody =
    provider === "github"
      ? { name: projectName, private: true, auto_init: true, default_branch: branchName }
      : { name: projectName, visibility: "private", default_branch: branchName };

  let response: any;

  switch (provider) {
    case "github":
      response = await $fetch("https://api.github.com/user/repos", {
        method: "POST",
        body: repoBody,
        headers: { ...headers, Accept: "application/vnd.github.v3+json" },
      });
      break;
    case "gitlab":
      response = await $fetch("https://gitlab.com/api/v4/projects", {
        method: "POST",
        body: repoBody,
        headers,
      });
      break;
  }

  return {
    success: true,
    repoUrl: response.html_url || response.web_url,
  };
});
