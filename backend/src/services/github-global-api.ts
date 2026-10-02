import { extractGitHubToken } from "./github-api";

interface GitHubSearchResponse<T> { items: T[]; }
interface SearchRepo { id: number; full_name: string; description?: string | null; html_url: string; }
interface SearchIssue { id: number; number: number; title: string; html_url: string; repository_url?: string; user?: { login?: string }; }
interface SearchUser { id: number; login: string; avatar_url?: string; html_url: string; }

async function githubJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "User-Agent": "GitInsight-AI", "X-GitHub-Api-Version": "2022-11-28" } });
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

function unauthorized() { return Response.json({ error: "Unauthorized", message: "Connect GitHub to use search and notifications." }, { status: 401 }); }

export async function handleGetGlobalSearch(request: Request): Promise<Response> {
  const token = extractGitHubToken(request);
  if (!token) return unauthorized();
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) return Response.json({ repositories: [], issues: [], users: [] });
  try {
    const encoded = encodeURIComponent(query);
    const [repositories, issues, users] = await Promise.all([
      githubSearch<SearchRepo>(`/search/repositories?q=${encoded}&per_page=5`, token),
      githubSearch<SearchIssue>(`/search/issues?q=${encoded}&per_page=5`, token),
      githubSearch<SearchUser>(`/search/users?q=${encoded}&per_page=5`, token),
    ]);
    return Response.json({ repositories: repositories.map((item) => ({ id: item.id, title: item.full_name, description: item.description, url: item.html_url, type: "Repository" })), issues: issues.map((item) => ({ id: item.id, title: `#${item.number} ${item.title}`, description: item.user?.login ? `by @${item.user.login}` : "GitHub issue", url: item.html_url, type: "Issue" })), users: users.map((item) => ({ id: item.id, title: `@${item.login}`, description: "GitHub contributor", url: item.html_url, avatarUrl: item.avatar_url, type: "Developer" })) });
  } catch (error) { return Response.json({ error: "GitHub API Error", message: error instanceof Error ? error.message : "Search failed." }, { status: 502 }); }
}

export async function handleGetNotifications(request: Request): Promise<Response> {
  const token = extractGitHubToken(request);
  if (!token) return unauthorized();
  try {
    const notifications = await githubJson<Array<{ id: string; subject?: { title?: string }; repository?: { full_name?: string }; updated_at?: string }>>("/notifications?all=false&participating=false&per_page=100", token);
    return Response.json({ count: notifications.length, items: notifications.slice(0, 10).map((item) => ({ id: item.id, title: item.subject?.title ?? "GitHub notification", repository: item.repository?.full_name ?? "", updatedAt: item.updated_at })) });
  } catch (error) { return Response.json({ error: "GitHub API Error", message: error instanceof Error ? error.message : "Notifications failed." }, { status: 502 }); }
}

async function nodeHandler(req: any, res: any, handler: (request: Request) => Promise<Response>) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers ?? {})) {
    if (typeof value === "string") headers.set(name, value);
  }
  const request = new Request(`http://${req.headers?.host ?? "localhost"}${req.url ?? "/"}`, { method: req.method, headers });
  const response = await handler(request);
  res.statusCode = response.status;
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.end(await response.text());
}

export function nodeGlobalSearchHandler(req: any, res: any) { return nodeHandler(req, res, handleGetGlobalSearch); }
export function nodeNotificationsHandler(req: any, res: any) { return nodeHandler(req, res, handleGetNotifications); }
