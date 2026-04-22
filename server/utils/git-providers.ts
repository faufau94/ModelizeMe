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

export function extractZipEntries(zipBuffer: Buffer): FileEntry[] {
  const data = new Uint8Array(zipBuffer);
  const files = unzipSync(data);
  const entries: FileEntry[] = [];

  for (const [filePath, fileData] of Object.entries(files)) {
    if (filePath.endsWith("/") || fileData.length === 0) continue;

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

export async function createGitHubRepo(
  token: string,
  repoName: string,
  branchName: string,
  files: FileEntry[],
  isPublic = false,
  description = ""
): Promise<CreateRepoResult> {
  // 1. Create repo with auto_init — GitHub creates the default branch "main"
  //    and an initial README commit. The Git Database API requires a non-empty repo.
  const repo: any = await githubFetch("/user/repos", token, {
    method: "POST",
    body: {
      name: repoName,
      private: !isPublic,
      description,
      auto_init: true,
    },
  });

  const owner = repo.owner.login;
  const repoPath = `/repos/${owner}/${repoName}`;
  // GitHub always creates "main" when auto_init is true (regardless of default_branch hint)
  const initialBranch = repo.default_branch || "main";

  // 2. Get the initial commit SHA and tree SHA
  const refData: any = await githubFetch(
    `${repoPath}/git/ref/heads/${initialBranch}`,
    token
  );
  const baseSha = refData.object.sha;

  const baseCommit: any = await githubFetch(
    `${repoPath}/git/commits/${baseSha}`,
    token
  );
  const baseTreeSha = baseCommit.tree.sha;

  // 3. Create blobs for each file
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

  // 4. Create tree on top of the initial commit's tree.
  //    Using base_tree keeps files we don't override (e.g. README if not in ZIP).
  //    If the ZIP contains README.md, it overrides the auto-generated one.
  const tree: any = await githubFetch(`${repoPath}/git/trees`, token, {
    method: "POST",
    body: { tree: treeItems, base_tree: baseTreeSha },
  });

  // 5. Create commit with the initial commit as parent
  const commit: any = await githubFetch(`${repoPath}/git/commits`, token, {
    method: "POST",
    body: {
      message: "Initial commit from ModelizeMe",
      tree: tree.sha,
      parents: [baseSha],
    },
  });

  // 6. Fast-forward the branch to the new commit
  await githubFetch(`${repoPath}/git/refs/heads/${initialBranch}`, token, {
    method: "PATCH",
    body: { sha: commit.sha },
  });

  // 7. If the user wants a different branch name than GitHub's default, rename it
  if (branchName !== initialBranch) {
    await githubFetch(`${repoPath}/branches/${initialBranch}/rename`, token, {
      method: "POST",
      body: { new_name: branchName },
    });
  }

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
 * Poll the GitLab branches endpoint until the default branch is ready.
 * GitLab creates projects asynchronously — pushing files too early fails.
 */
async function waitForGitLabBranch(
  projectId: number,
  branchName: string,
  token: string,
  maxAttempts = 15,
  intervalMs = 1000
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await gitlabFetch(
        `/projects/${projectId}/repository/branches/${encodeURIComponent(branchName)}`,
        token
      );
      return;
    } catch {
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
  throw new Error(
    `GitLab branch "${branchName}" did not become ready after ${maxAttempts * intervalMs}ms`
  );
}

export async function createGitLabRepo(
  token: string,
  repoName: string,
  branchName: string,
  files: FileEntry[],
  isPublic = false,
  description = ""
): Promise<CreateRepoResult> {
  // 1. Create project with README so the default branch exists immediately
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

  // 2. Wait for the default branch to be fully ready (repo init is async)
  await waitForGitLabBranch(projectId, branchName, token);

  // 3. Fetch the existing tree to know which files to "update" vs "create"
  // The README created by initialize_with_readme needs "update" if we replace it.
  let existingPaths = new Set<string>();
  try {
    const tree: any = await gitlabFetch(
      `/projects/${projectId}/repository/tree?ref=${encodeURIComponent(branchName)}&recursive=true&per_page=100`,
      token
    );
    existingPaths = new Set(
      (Array.isArray(tree) ? tree : []).filter((e: any) => e.type === "blob").map((e: any) => e.path)
    );
  } catch {
    // Non-fatal: fall back to "create" for everything
  }

  // 4. Push all files in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const actions = batch.map((file) => ({
      action: existingPaths.has(file.path) ? ("update" as const) : ("create" as const),
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

    // Mark these files as existing for subsequent batches
    for (const f of batch) existingPaths.add(f.path);
  }

  return { repoUrl: project.web_url };
}
