// Thin wrapper around the GitHub Remote MCP server. The endpoint and bearer
// auth are documented at https://github.com/github/github-mcp-server.
// We send the user's NextAuth GitHub OAuth access_token as the Bearer; GitHub
// accepts both PATs and OAuth tokens at this endpoint.

import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";

export type RepoSummary = {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  pushedAt: string | null;
  htmlUrl: string;
  language: string | null;
  isFork: boolean;
};

export async function listAuthenticatedUserRepos(
  token: string
): Promise<{ login: string | null; repos: RepoSummary[] }> {
  // GitHub REST /user/repos lists the authenticated user's repos directly with
  // no search-index dependency. Used as the authoritative repo list so the
  // model can't hallucinate paths.
  const res = await fetch(
    "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "ScoutFolio",
      },
    }
  );
  if (!res.ok) {
    throw new Error(`GitHub /user/repos returned ${res.status}`);
  }
  const data = (await res.json()) as Array<{
    name: string;
    full_name: string;
    description: string | null;
    stargazers_count: number;
    pushed_at: string | null;
    html_url: string;
    language: string | null;
    fork: boolean;
    owner: { login: string };
  }>;

  const repos: RepoSummary[] = data
    .filter((r) => !r.fork)
    .map((r) => ({
      owner: r.owner.login,
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      stars: r.stargazers_count,
      pushedAt: r.pushed_at,
      htmlUrl: r.html_url,
      language: r.language,
      isFork: r.fork,
    }))
    .sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      const at = a.pushedAt ? Date.parse(a.pushedAt) : 0;
      const bt = b.pushedAt ? Date.parse(b.pushedAt) : 0;
      return bt - at;
    });

  const login = data[0]?.owner.login ?? null;
  return { login, repos };
}

const DEFAULT_ENDPOINT = "https://api.githubcopilot.com/mcp/";

// Whitelist of tools we actually use. The full toolset blows past Anthropic
// Tier-1 input-token-per-minute budget on a single request because each tool's
// JSON schema is loaded into the system prompt.
const ALLOWED_TOOLS = new Set([
  "get_me",
  "search_repositories",
  "list_repositories",
  "list_my_repositories",
  "list_repositories_for_user",
  "list_user_repositories",
  "get_file_contents",
]);

export type GitHubMCPHandle = {
  client: MCPClient;
  tools: Awaited<ReturnType<MCPClient["tools"]>>;
  allToolNames: string[];
  close: () => Promise<void>;
};

export async function openGitHubMCP(token: string): Promise<GitHubMCPHandle> {
  if (!token) throw new Error("Missing GitHub access token");

  const url = process.env.GITHUB_MCP_ENDPOINT?.trim() || DEFAULT_ENDPOINT;

  const client = await createMCPClient({
    transport: {
      type: "http",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "X-MCP-Toolsets": "context,repos",
        "X-MCP-Readonly": "true",
      },
    },
  });

  const all = await client.tools();
  const allNames = Object.keys(all);
  const filtered = Object.fromEntries(
    Object.entries(all).filter(([name]) => ALLOWED_TOOLS.has(name))
  ) as typeof all;

  return {
    client,
    tools: filtered,
    allToolNames: allNames,
    close: async () => {
      try {
        await client.close();
      } catch {
        // best-effort
      }
    },
  };
}
