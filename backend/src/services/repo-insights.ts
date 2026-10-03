import { extractGitHubToken, type SimplifiedRepo } from "./github-api.js";
import { getEnv } from "../config/env.js";

export interface ContributedRepo extends SimplifiedRepo {
  contribution_types: string[]; // e.g. ["PushEvent", "PullRequestEvent"]
  last_contributed_at: string;
  total_contributions: number;
}

export interface RepoInsightsResponse {
  ownedReposCount: number;
  collaboratedReposCount: number;
  contributedReposCount: number;
  ownedRepos: SimplifiedRepo[];
  collaboratedRepos: SimplifiedRepo[];
  contributedRepos: ContributedRepo[];
}

function sanitizeToken(token: string): string {
  return token.replace(/^["']|["']$/g, "").trim();
}

/**
 * Standard GitHub REST API helper with timeout and sanitized headers
 */
async function githubFetch<T>(endpoint: string, token: string): Promise<T | null> {
  const cleanToken = sanitizeToken(token);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(`https://api.github.com${endpoint}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${cleanToken}`,
        "User-Agent": "GitInsight-AI",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * PART 1: Fetch Collaborated & Owned Repositories
 * Uses GET /user/repos?affiliation=owner,collaborator,organization_member
 */
export async function fetchUserReposByAffiliation(
  token: string,
  username: string,
): Promise<{ ownedRepos: SimplifiedRepo[]; collaboratedRepos: SimplifiedRepo[] }> {
  const cleanToken = sanitizeToken(token);
  const rawRepos =
    (await githubFetch<any[]>(
      "/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member",
      cleanToken,
    )) || [];

  const normalizedUsername = username.toLowerCase();
  const ownedRepos: SimplifiedRepo[] = [];
  const collaboratedRepos: SimplifiedRepo[] = [];

  for (const repo of rawRepos) {
    const ownerLogin = (repo.owner?.login || "").toLowerCase();
    const isOwner = ownerLogin === normalizedUsername;

    const formattedRepo: SimplifiedRepo = {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description ?? null,
      language: repo.language ?? "Unknown",
      stargazers_count: repo.stargazers_count ?? 0,
      forks_count: repo.forks_count ?? 0,
      updated_at: repo.updated_at,
      html_url: repo.html_url,
      default_branch: repo.default_branch || "main",
      open_issues_count: repo.open_issues_count ?? 0,
      private: Boolean(repo.private),
      is_collaborator: !isOwner,
      is_owner: isOwner,
      owner: {
        login: repo.owner?.login || "unknown",
        avatar_url: repo.owner?.avatar_url || "",
      },
    };

    if (isOwner) {
      ownedRepos.push(formattedRepo);
    } else {
      collaboratedRepos.push(formattedRepo);
    }
  }

  return { ownedRepos, collaboratedRepos };
}

/**
 * PART 2: Fetch Contributed Repositories via GitHub Events API
 * Uses GET /users/:username/events (filtering for PushEvent & PullRequestEvent)
 */
export async function fetchContributedReposFromEvents(
  token: string,
  username: string,
): Promise<ContributedRepo[]> {
  const cleanToken = sanitizeToken(token);
  // Fetch user events (up to 100 events)
  const events =
    (await githubFetch<any[]>(`/users/${username}/events?per_page=100`, cleanToken)) || [];

  // Filter events for PushEvent and PullRequestEvent
  const contributionEvents = events.filter(
    (e) => e.type === "PushEvent" || e.type === "PullRequestEvent",
  );

  // Map to collect unique repository contribution stats
  const repoStatsMap = new Map<
    string,
    {
      repoFullName: string;
      types: Set<string>;
      lastContributedAt: string;
      count: number;
    }
  >();

  for (const event of contributionEvents) {
    const repoName = event.repo?.name;
    if (!repoName) continue;

    const existing = repoStatsMap.get(repoName);
    const eventTime = event.created_at || new Date().toISOString();

    if (!existing) {
      repoStatsMap.set(repoName, {
        repoFullName: repoName,
        types: new Set([event.type]),
        lastContributedAt: eventTime,
        count: 1,
      });
    } else {
      existing.types.add(event.type);
      existing.count += 1;
      if (new Date(eventTime) > new Date(existing.lastContributedAt)) {
        existing.lastContributedAt = eventTime;
      }
    }
  }

  // For each unique contributed repo, fetch repository metadata
  const uniqueRepoNames = Array.from(repoStatsMap.keys());
  const contributedRepos: ContributedRepo[] = await Promise.all(
    uniqueRepoNames.map(async (fullName) => {
      const stats = repoStatsMap.get(fullName)!;
      const repoDetails = await githubFetch<any>(`/repos/${fullName}`, cleanToken);

      if (repoDetails) {
        return {
          id: repoDetails.id,
          name: repoDetails.name,
          full_name: repoDetails.full_name,
          description: repoDetails.description ?? null,
          language: repoDetails.language ?? "Unknown",
          stargazers_count: repoDetails.stargazers_count ?? 0,
          forks_count: repoDetails.forks_count ?? 0,
          updated_at: repoDetails.updated_at,
          html_url: repoDetails.html_url,
          default_branch: repoDetails.default_branch || "main",
          open_issues_count: repoDetails.open_issues_count ?? 0,
          private: Boolean(repoDetails.private),
          is_collaborator:
            (repoDetails.owner?.login || "").toLowerCase() !== username.toLowerCase(),
          is_owner: (repoDetails.owner?.login || "").toLowerCase() === username.toLowerCase(),
          owner: {
            login: repoDetails.owner?.login || fullName.split("/")[0] || "unknown",
            avatar_url: repoDetails.owner?.avatar_url || "",
          },
          contribution_types: Array.from(stats.types),
          last_contributed_at: stats.lastContributedAt,
          total_contributions: stats.count,
        };
      }

      // Fallback if public repo metadata is restricted
      const [owner, name] = fullName.split("/");
      return {
        id: Math.abs(fullName.split("").reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0)),
        name: name || fullName,
        full_name: fullName,
        description: `Contributed via ${Array.from(stats.types).join(", ")}`,
        language: "Unknown",
        stargazers_count: 0,
        forks_count: 0,
        updated_at: stats.lastContributedAt,
        html_url: `https://github.com/${fullName}`,
        default_branch: "main",
        open_issues_count: 0,
        private: false,
        is_collaborator: owner?.toLowerCase() !== username.toLowerCase(),
        is_owner: owner?.toLowerCase() === username.toLowerCase(),
        owner: {
          login: owner || "unknown",
          avatar_url: `https://github.com/${owner}.png`,
        },
        contribution_types: Array.from(stats.types),
        last_contributed_at: stats.lastContributedAt,
        total_contributions: stats.count,
      };
    }),
  );

  return contributedRepos;
}

/**
 * PART 3: Combined Handler for GET /api/repos/insights
 */
export async function handleGetRepoInsights(request: Request): Promise<Response> {
  const token = extractGitHubToken(request);

  if (!token) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "GitHub access token is required. Pass it via Authorization header or log in.",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const cleanToken = sanitizeToken(token);

  try {
    // 1. Fetch user profile to resolve username with detailed error handling
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${cleanToken}`,
        "User-Agent": "GitInsight-AI",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    const userData = await userRes.json().catch(() => ({}));
    if (!userRes.ok || !userData.login) {
      throw new Error(
        userData.message || "Failed to authenticate with GitHub. Please check your token or login.",
      );
    }

    const username = userData.login;

    // 2. Fetch both categories concurrently
    const [{ ownedRepos, collaboratedRepos }, contributedRepos] = await Promise.all([
      fetchUserReposByAffiliation(cleanToken, username),
      fetchContributedReposFromEvents(cleanToken, username),
    ]);

    const payload: RepoInsightsResponse = {
      ownedReposCount: ownedRepos.length,
      collaboratedReposCount: collaboratedRepos.length,
      contributedReposCount: contributedRepos.length,
      ownedRepos,
      collaboratedRepos,
      contributedRepos,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: "Repo Insights Error",
        message: err.message || "Failed to fetch repository insights from GitHub.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

/**
 * Connect middleware adapter for Vite dev server
 */
export async function nodeRepoInsightsHandler(req: any, res: any) {
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
    if (match && match[1]) cookieToken = decodeURIComponent(match[1]);
  }

  const authHeader = req.headers["authorization"] || req.headers["x-github-token"];
  let token = cookieToken || getEnv("GITHUB_ACCESS_TOKEN") || getEnv("GITHUB_TOKEN") || null;
  if (authHeader) {
    if (authHeader.startsWith("Bearer ") || authHeader.startsWith("bearer ")) {
      token = authHeader.slice(7).trim();
    } else if (authHeader.startsWith("token ") || authHeader.startsWith("Token ")) {
      token = authHeader.slice(6).trim();
    } else {
      token = authHeader.trim();
    }
  }

  if (!token) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Unauthorized",
        message: "GitHub access token is required. Please log in or configure GITHUB_ACCESS_TOKEN.",
      }),
    );
    return;
  }

  const cleanToken = sanitizeToken(token);

  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${cleanToken}`,
        "User-Agent": "GitInsight-AI",
      },
    });

    const userData = await userRes.json().catch(() => ({}));
    if (!userRes.ok || !userData.login) {
      throw new Error(userData.message || "Failed to authenticate with GitHub. Invalid token.");
    }

    const username = userData.login;

    const [{ ownedRepos, collaboratedRepos }, contributedRepos] = await Promise.all([
      fetchUserReposByAffiliation(cleanToken, username),
      fetchContributedReposFromEvents(cleanToken, username),
    ]);

    const payload: RepoInsightsResponse = {
      ownedReposCount: ownedRepos.length,
      collaboratedReposCount: collaboratedRepos.length,
      contributedReposCount: contributedRepos.length,
      ownedRepos,
      collaboratedRepos,
      contributedRepos,
    };

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.end(JSON.stringify(payload));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Repo Insights Error",
        message: err.message || "Failed to fetch repository insights from GitHub.",
      }),
    );
  }
}
