import { getEnv } from "../config/env.js";

export interface SimplifiedRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  pushed_at?: string | null;
  archived?: boolean;
  html_url: string;
  default_branch: string;
  open_issues_count: number;
  private: boolean;
  is_collaborator: boolean;
  is_owner: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface ReposApiResponse {
  currentUser: string;
  count: number;
  ownedCount: number;
  collaboratedCount: number;
  ownedRepos: SimplifiedRepo[];
  collaboratedRepos: SimplifiedRepo[];
  data: SimplifiedRepo[];
}

export interface GitHubErrorResponse {
  error: string;
  message: string;
  status?: number;
}

function sanitizeToken(token: string): string {
  return token.replace(/^["']|["']$/g, "").trim();
}

/**
 * Extracts GitHub token from Authorization header, custom header, or environment variables.
 */
export function extractGitHubToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || request.headers.get("Cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)github_token=([^;]*)/);
    if (match && match[1]) return sanitizeToken(decodeURIComponent(match[1]));
  }

  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (authHeader) {
    if (authHeader.startsWith("Bearer ") || authHeader.startsWith("bearer ")) {
      return sanitizeToken(authHeader.slice(7));
    }
    if (authHeader.startsWith("token ") || authHeader.startsWith("Token ")) {
      return sanitizeToken(authHeader.slice(6));
    }
    return sanitizeToken(authHeader);
  }

  const customHeader = request.headers.get("x-github-token");
  if (customHeader) {
    return sanitizeToken(customHeader);
  }

  // Fallback to environment variable
  const envToken = getEnv("GITHUB_ACCESS_TOKEN") || getEnv("GITHUB_TOKEN") || null;
  return envToken ? sanitizeToken(envToken) : null;
}

function formatRepo(raw: any, isCollaborator: boolean): SimplifiedRepo {
  return {
    id: raw.id,
    name: raw.name,
    full_name: raw.full_name,
    description: raw.description ?? null,
    language: raw.language ?? "Unknown",
    stargazers_count: raw.stargazers_count ?? 0,
    forks_count: raw.forks_count ?? 0,
    updated_at: raw.updated_at,
    pushed_at: raw.pushed_at ?? null,
    archived: Boolean(raw.archived),
    html_url: raw.html_url,
    default_branch: raw.default_branch || "main",
    open_issues_count: raw.open_issues_count ?? 0,
    private: Boolean(raw.private),
    is_collaborator: isCollaborator,
    is_owner: !isCollaborator,
    owner: {
      login: raw.owner?.login || "unknown",
      avatar_url: raw.owner?.avatar_url || "",
    },
  };
}

/**
 * Fetches repositories by explicitly querying:
 * 1. GET /user/repos?affiliation=owner
 * 2. GET /user/repos?affiliation=collaborator
 */
export async function fetchGitHubUserRepos(token: string): Promise<{
  currentUser: string;
  ownedRepos: SimplifiedRepo[];
  collaboratedRepos: SimplifiedRepo[];
  repos: SimplifiedRepo[];
}> {
  const cleanToken = sanitizeToken(token);

  const [userRes, ownedRes, collabRes] = await Promise.all([
    fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${cleanToken}`,
        "User-Agent": "GitInsight-AI",
      },
    }),
    fetch("https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner", {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${cleanToken}`,
        "User-Agent": "GitInsight-AI",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }),
    fetch("https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=collaborator", {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${cleanToken}`,
        "User-Agent": "GitInsight-AI",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }),
  ]);

  if (!ownedRes.ok && !collabRes.ok) {
    const errorBody = await ownedRes.json().catch(() => ({ message: ownedRes.statusText }));
    const error = new Error(errorBody.message || `GitHub API error: ${ownedRes.status}`);
    (error as any).status = ownedRes.status;
    throw error;
  }

  const userData = userRes.ok ? await userRes.json().catch(() => null) : null;
  const rawOwned = ownedRes.ok ? ((await ownedRes.json()) as any[]) : [];
  let rawCollab = collabRes.ok ? ((await collabRes.json()) as any[]) : [];

  const ownedRepos: SimplifiedRepo[] = rawOwned.map((r) => formatRepo(r, false));
  const collaboratedRepos: SimplifiedRepo[] = rawCollab.map((r) => formatRepo(r, true));

  // Merge into unified list with collaborated repositories first
  const repos = [...collaboratedRepos, ...ownedRepos];

  return {
    currentUser: userData?.login || "User",
    ownedRepos,
    collaboratedRepos,
    repos,
  };
}

/**
 * Handler for GET /api/repos
 */
export async function handleGetRepos(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return new Response(
      JSON.stringify({
        error: "Method Not Allowed",
        message: "Only GET is supported on /api/repos",
      }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const token = extractGitHubToken(request);

  if (!token) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message:
          "GitHub access token is required. Pass it via 'Authorization: Bearer <token>' header or define GITHUB_ACCESS_TOKEN in your .env file.",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const { currentUser, ownedRepos, collaboratedRepos, repos } = await fetchGitHubUserRepos(token);

    const payload: ReposApiResponse = {
      currentUser,
      count: repos.length,
      ownedCount: ownedRepos.length,
      collaboratedCount: collaboratedRepos.length,
      ownedRepos,
      collaboratedRepos,
      data: repos,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return new Response(
      JSON.stringify({
        error: "GitHub API Error",
        message: err.message || "Failed to fetch repositories from GitHub",
      }),
      {
        status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

/**
 * Node / Connect middleware adapter for Vite dev server
 */
export async function nodeApiReposHandler(req: any, res: any) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  const cookieHeader = req.headers["cookie"] || "";
  let cookieToken: string | null = null;
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)github_token=([^;]*)/);
    if (match && match[1]) cookieToken = sanitizeToken(decodeURIComponent(match[1]));
  }

  const authHeader = req.headers["authorization"] || req.headers["x-github-token"];
  let token = cookieToken || getEnv("GITHUB_ACCESS_TOKEN") || getEnv("GITHUB_TOKEN") || null;
  if (authHeader) {
    if (authHeader.startsWith("Bearer ") || authHeader.startsWith("bearer ")) {
      token = sanitizeToken(authHeader.slice(7));
    } else if (authHeader.startsWith("token ") || authHeader.startsWith("Token ")) {
      token = sanitizeToken(authHeader.slice(6));
    } else {
      token = sanitizeToken(authHeader);
    }
  }

  if (!token) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Unauthorized",
        message:
          "GitHub access token is required. Pass it via 'Authorization: Bearer <token>' header or define GITHUB_ACCESS_TOKEN in your .env file.",
      }),
    );
    return;
  }

  try {
    const { currentUser, ownedRepos, collaboratedRepos, repos } = await fetchGitHubUserRepos(token);

    const payload: ReposApiResponse = {
      currentUser,
      count: repos.length,
      ownedCount: ownedRepos.length,
      collaboratedCount: collaboratedRepos.length,
      ownedRepos,
      collaboratedRepos,
      data: repos,
    };

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.end(JSON.stringify(payload));
  } catch (err: any) {
    res.statusCode = err.status || 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "GitHub API Error",
        message: err.message || "Failed to fetch repositories from GitHub",
      }),
    );
  }
}
