import { unzipSync, strFromU8 } from "fflate";

// ─── Types ─────────────────────────────────

interface FileEntry {
  path: string;
  content: string;
  encoding: "utf-8" | "base64";
}

interface CreateRepoResult {
  repoUrl: string;
}

// ─── Shared helpers ────────────────────────

/**
 * Extract files from a ZIP buffer. Returns an array of { path, content, encoding }.
 * Binary files are base64-encoded, text files are UTF-8.
 */
export function extractZipEntries(zipBuffer: Buffer): FileEntry[] {
  const data = new Uint8Array(zipBuffer);
  const files = unzipSync(data);
  const entries: FileEntry[] = [];

  for (const [filePath, fileData] of Object.entries(files)) {
    // Skip directories (empty entries ending with /)
    if (filePath.endsWith("/") || fileData.length === 0) continue;

    // Detect binary vs text
    if (isBinary(fileData)) {
      entries.push({
        path: filePath,
        content: Buffer.from(fileData).toString("base64"),
        encoding: "base64",
      });
    } else {
      entries.push({
        path: filePath,
        content: strFromU8(fileData),
        encoding: "utf-8",
      });
    }
  }

  return entries;
}

/**
 * Simple binary detection: check for null bytes in first 8KB.
 */
function isBinary(data: Uint8Array): boolean {
  const len = Math.min(data.length, 8192);
  for (let i = 0; i < len; i++) {
    if (data[i] === 0) return true;
  }
  return false;
}

// ─── GitHub ────────────────────────────────

const GITHUB_API = "https://api.github.com";

async function githubFetch(path: string, token: string, options: any = {}) {
  return $fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
      ...options.headers,
    },
  });
}

/**
 * Create a GitHub repo and push all files using the Git Trees API.
 * Flow: create repo → create blobs → create tree → create commit → create ref
 */
export async function createGitHubRepo(
  token: string,
  repoName: string,
  branchName: string,
  files: FileEntry[],
  isPublic = false,
  description = ""
): Promise<CreateRepoResult> {
  // 1. Create repo with auto_init so GitHub creates an initial commit (avoids "empty repo" errors)
  const repo: any = await githubFetch("/user/repos", token, {
    method: "POST",
    body: {
      name: repoName,
      private: !isPublic,
      description,
      auto_init: true,
      default_branch: branchName,
    },
  });

  const owner = repo.owner.login;
  const repoPath = `/repos/${owner}/${repoName}`;

  // 2. Get the SHA of the initial commit created by auto_init
  const refData: any = await githubFetch(
    `${repoPath}/git/ref/heads/${branchName}`,
    token
  );
  const baseSha = refData.object.sha;

  // 3. Get the tree SHA of the initial commit
  const baseCommit: any = await githubFetch(
    `${repoPath}/git/commits/${baseSha}`,
    token
  );
  const baseTreeSha = baseCommit.tree.sha;

  // 4. Create blobs for each file
  const treeItems = await Promise.all(
    files.map(async (file) => {
      const blob: any = await githubFetch(`${repoPath}/git/blobs`, token, {
        method: "POST",
        body: {
          content: file.content,
          encoding: file.encoding === "base64" ? "base64" : "utf-8",
        },
      });
      return {
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    })
  );

  // 5. Create tree on top of base tree
  const tree: any = await githubFetch(`${repoPath}/git/trees`, token, {
    method: "POST",
    body: { tree: treeItems, base_tree: baseTreeSha },
  });

  // 6. Create commit with parent
  const commit: any = await githubFetch(`${repoPath}/git/commits`, token, {
    method: "POST",
    body: {
      message: "Initial commit from ModelizeMe",
      tree: tree.sha,
      parents: [baseSha],
    },
  });

  // 7. Update the branch ref to point to the new commit
  await githubFetch(`${repoPath}/git/refs/heads/${branchName}`, token, {
    method: "PATCH",
    body: { sha: commit.sha, force: true },
  });

  return { repoUrl: repo.html_url };
}

// ─── GitLab ────────────────────────────────

const GITLAB_API = "https://gitlab.com/api/v4";

async function gitlabFetch(path: string, token: string, options: any = {}) {
  return $fetch(`${GITLAB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

/**
 * Create a GitLab project and push all files using the Commits API.
 * Single request to create initial commit with all files.
 */
export async function createGitLabRepo(
  token: string,
  repoName: string,
  branchName: string,
  files: FileEntry[],
  isPublic = false,
  description = ""
): Promise<CreateRepoResult> {
  // 1. Create project (initialize_with_readme to have a branch)
  const project: any = await gitlabFetch("/projects", token, {
    method: "POST",
    body: {
      name: repoName,
      description,
      visibility: isPublic ? "public" : "private",
      default_branch: branchName,
      initialize_with_readme: true,
    },
  });

  const projectId = project.id;

  // 2. Push all files in a single commit via the Commits API
  // Batch files to avoid request size limits (max ~50 files per request)
  const BATCH_SIZE = 50;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const actions = batch.map((file) => ({
      action: "create" as const,
      file_path: file.path,
      content: file.content,
      encoding: file.encoding === "base64" ? "base64" : "text",
    }));

    const message =
      i === 0
        ? "Initial commit from ModelizeMe"
        : `Add files (batch ${Math.floor(i / BATCH_SIZE) + 1})`;

    await gitlabFetch(`/projects/${projectId}/repository/commits`, token, {
      method: "POST",
      body: {
        branch: branchName,
        commit_message: message,
        actions,
      },
    });
  }

  return { repoUrl: project.web_url };
}
