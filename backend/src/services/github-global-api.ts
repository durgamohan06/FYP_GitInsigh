import type { Request, Response } from "express";
import { extractGitHubToken } from "./github-api.js";

interface GitHubSearchResponse<T> {
  items: T[];
}
interface SearchRepo {
  id: number;
  full_name: string;
  description?: string | null;
  html_url: string;
}
interface SearchIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  repository_url?: string;
  user?: { login?: string };
}
interface SearchUser {
  id: number;
  login: string;
  avatar_url?: string;
  html_url: string;
}

async function githubJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "GitInsight-AI",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
  return (await response.json()) as T;
}

async function githubSearch<T>(path: string, token: string): Promise<T[]> {
  try {
    const response = await githubJson<{ items?: T[] }>(path, token);
    return response.items ?? [];
  } catch {
    // GitHub can reject one search index with 422 or rate-limit it independently.
    // Keep the other search categories available to the user.
    return [];
  }
}

export async function handleGetGlobalSearch(req: Request, res: Response): Promise<void> {
  const token = extractGitHubToken(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized", message: "Connect GitHub to use search and notifications." });
    return;
  }
  const query = (req.query.q as string | undefined)?.trim();
  if (!query) {
    res.json({ repositories: [], issues: [], users: [] });
    return;
  }
  try {
    const encoded = encodeURIComponent(query);
    const [repositories, issues, users] = await Promise.all([
      githubSearch<SearchRepo>(`/search/repositories?q=${encoded}&per_page=5`, token),
      githubSearch<SearchIssue>(`/search/issues?q=${encoded}&per_page=5`, token),
      githubSearch<SearchUser>(`/search/users?q=${encoded}&per_page=5`, token),
    ]);
    res.json({
      repositories: repositories.map((item) => ({
        id: item.id,
        title: item.full_name,
        description: item.description,
        url: item.html_url,
        type: "Repository",
      })),
      issues: issues.map((item) => ({
        id: item.id,
        title: `#${item.number} ${item.title}`,
        description: item.user?.login ? `by @${item.user.login}` : "GitHub issue",
        url: item.html_url,
        type: "Issue",
      })),
      users: users.map((item) => ({
        id: item.id,
        title: `@${item.login}`,
        description: "GitHub contributor",
        url: item.html_url,
        avatarUrl: item.avatar_url,
        type: "Developer",
      })),
    });
  } catch (error) {
    res.status(502).json({
      error: "GitHub API Error",
      message: error instanceof Error ? error.message : "Search failed.",
    });
  }
}

export async function handleGetNotifications(req: Request, res: Response): Promise<void> {
  const token = extractGitHubToken(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized", message: "Connect GitHub to use search and notifications." });
    return;
  }
  try {
    const notifications = await githubJson<
      Array<{ id: string; subject?: { title?: string }; repository?: { full_name?: string }; updated_at?: string }>
    >("/notifications?all=false&participating=false&per_page=100", token);
    res.json({
      count: notifications.length,
      items: notifications.slice(0, 10).map((item) => ({
        id: item.id,
        title: item.subject?.title ?? "GitHub notification",
        repository: item.repository?.full_name ?? "",
        updatedAt: item.updated_at,
      })),
    });
  } catch (error) {
    res.status(502).json({
      error: "GitHub API Error",
      message: error instanceof Error ? error.message : "Notifications failed.",
    });
  }
}

function ensureExpressRes(res: any) {
  if (typeof res.json !== "function") {
    res.json = (data: any) => {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    };
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
  }
}

export function nodeGlobalSearchHandler(req: any, res: any) {
  ensureExpressRes(res);
  return handleGetGlobalSearch(req, res);
}

export function nodeNotificationsHandler(req: any, res: any) {
  ensureExpressRes(res);
  return handleGetNotifications(req, res);
}
