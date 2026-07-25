import type { FileNode } from "@/lib/types";
import { Octokit } from "@octokit/rest";

/** UTF-8 safe base64 encode for the GitHub contents API. */
function encode(content: string): string {
  return btoa(unescape(encodeURIComponent(content)));
}

/**
 * Push a project's files to a new GitHub repo owned by the token holder.
 * Uses the user's own PAT (BYOK). Browser-direct (api.github.com supports CORS for these calls).
 *
 * Status: scaffold. M4 hardens multi-file commits via the git trees API.
 */
export async function pushToGitHub(
  token: string,
  repoName: string,
  files: FileNode[],
  opts: { private?: boolean } = {},
): Promise<{ owner: string; repo: string; url: string }> {
  const octokit = new Octokit({ auth: token });
  const { data: user } = await octokit.rest.users.getAuthenticated();
  const owner = user.login;

  await octokit.rest.repos.createForAuthenticatedUser({
    name: repoName,
    private: opts.private ?? true,
    auto_init: false,
  });

  // TODO(M4): batch into a single commit via git data API. Per-file push works for MVP.
  for (const file of files) {
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: file.path,
      message: `feat: add ${file.path}`,
      content: encode(file.content),
    });
  }

  return { owner, repo: repoName, url: `https://github.com/${owner}/${repoName}` };
}
