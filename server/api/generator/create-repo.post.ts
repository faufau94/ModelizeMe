import { requireAuth } from "~/server/utils/auth";
import { z } from "zod";
import prisma from "~/lib/prisma";
import {
  extractZipEntries,
  createGitHubRepo,
  createGitLabRepo,
} from "~/server/utils/git-providers";

const createRepoSchema = z.object({
  provider: z.enum(["github", "gitlab"]),
  projectName: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, "Nom de projet invalide"),
  generatedProjectName: z.string().min(1).max(200),
  branchName: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9._/-]+$/, "Nom de branche invalide"),
});

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event);

  const body = await readBody(event);
  const { provider, projectName, generatedProjectName, branchName } = createRepoSchema.parse(body);

  // Retrieve OAuth access token server-side from the linked account
  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: provider,
    },
    select: { accessToken: true },
  });

  if (!account?.accessToken) {
    throw createError({
      statusCode: 403,
      message: `Aucun compte ${provider} lié. Veuillez d'abord connecter votre compte ${provider}.`,
    });
  }

  const token = account.accessToken;

  // Download the generated project ZIP from the backend
  const zipBlob = await $fetch(process.env.URL_BACKEND + "/api/download-project", {
    method: "POST",
    body: { projectName: generatedProjectName },
    responseType: "arrayBuffer",
  });

  const zipBuffer = Buffer.from(zipBlob as ArrayBuffer);
  const files = extractZipEntries(zipBuffer);

  if (!files.length) {
    throw createError({
      statusCode: 500,
      message: "Le projet généré est vide.",
    });
  }

  // Strip the top-level directory from file paths if all files share one
  // e.g. "my-project/src/index.ts" → "src/index.ts"
  const firstSlash = files[0].path.indexOf("/");
  if (firstSlash > 0) {
    const prefix = files[0].path.substring(0, firstSlash + 1);
    const allSharePrefix = files.every((f) => f.path.startsWith(prefix));
    if (allSharePrefix) {
      for (const f of files) {
        f.path = f.path.substring(prefix.length);
      }
    }
  }

  // Create repo and push files
  try {
    let result;
    switch (provider) {
      case "github":
        result = await createGitHubRepo(token, projectName, branchName, files);
        break;
      case "gitlab":
        result = await createGitLabRepo(token, projectName, branchName, files);
        break;
    }

    return {
      success: true,
      repoUrl: result.repoUrl,
    };
  } catch (err: any) {
    // Handle known API errors with clear messages
    const status = err?.response?.status || err?.statusCode || 500;
    const detail = err?.data?.message || err?.data?.error?.message || err?.message || "";

    if (status === 422 || status === 400) {
      throw createError({
        statusCode: 409,
        message: `Un dépôt "${projectName}" existe déjà sur ${provider}. Choisissez un autre nom.`,
      });
    }
    if (status === 401 || status === 403) {
      throw createError({
        statusCode: 403,
        message: `Token ${provider} invalide ou expiré. Reconnectez votre compte ${provider}.`,
      });
    }

    throw createError({
      statusCode: 500,
      message: `Erreur lors de la création du dépôt : ${detail}`,
    });
  }
});
