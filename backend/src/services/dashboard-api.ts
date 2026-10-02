import { extractGitHubToken, fetchGitHubUserRepos, type SimplifiedRepo } from "./github-api";
import { getEnv } from "../config/env";

export interface DashboardMetricStat {
  label: string;
  value: number;
  trend: number;
  icon: string;
  spark: number[];
}

export interface DashboardRepoSummary {
  id: string;
  name: string;
  owner: string;
  branch: string;
  commits: number;
  prs: number;
  issues: number;
  updated: string;
  status: "Healthy" | "Delayed" | "Blocked";
  progress: number;
  language: string;
  stars: number;
  forks: number;
  health: number;
}

export interface DashboardBlocker {
  title: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  impact: string;
  fix: string;
  repo: string;
}

export interface ActivityDay {
  day: string;
  date: string;
  commits: number;
  prs: number;
}

export interface DashboardDataResponse {
  totalRepos: number;
  totalCommits: number;
  openIssues: number;
  openPRs: number;
  contributorsCount: number;
  healthScore: number;
  recentCommits7d: number;
  stalePRsCount: number;
  stats: DashboardMetricStat[];
  activity: ActivityDay[];
  repositories: DashboardRepoSummary[];
  blockers: DashboardBlocker[];
  heatmap: number[][];
}

const dashboardCache = new Map<string, { data: DashboardDataResponse; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function sanitizeToken(token: string): string {
  return token.replace(/^["']|["']$/g, "").trim();
}

function calculateHealthScore(openIssues: number, stalePRs: number, recentCommits: number): number {
  const base = 100;
  const issuePenalty = openIssues * 2;
  const prPenalty = stalePRs * 3;
  const commitBonus = Math.min(recentCommits, 15);
  return Math.min(100, Math.max(0, base - issuePenalty - prPenalty + commitBonus));
}

async function githubFetch<T>(endpoint: string, token: string): Promise<T | null> {
  const cleanToken = sanitizeToken(token);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

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

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return `${Math.floor(diffInDays / 30)}mo ago`;
}

/**
 * Main aggregator handler for GET /api/dashboard
 */
export async function handleGetDashboard(request: Request): Promise<Response> {
  const token = extractGitHubToken(request);

  if (!token) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "GitHub access token is required. Please log in or configure GITHUB_ACCESS_TOKEN.",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const cleanToken = sanitizeToken(token);
  const url = new URL(request.url);
  const isRefresh = url.searchParams.get("refresh") === "true";
  const cacheKey = cleanToken.slice(-10);

  if (!isRefresh && dashboardCache.has(cacheKey)) {
    const cached = dashboardCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }
  }

  try {
    // 1. Fetch user's repositories (both owned and collaborated)
    const { repos } = await fetchGitHubUserRepos(cleanToken);
    const totalRepos = repos.length;
    const topRepos = repos.slice(0, 6);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sinceDateIso = thirtyDaysAgo.toISOString();

    const activityMap: Record<string, { commits: number; prs: number }> = {};
    const daysList: { day: string; date: string }[] = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split("T")[0];
      const dayLabel = `D${30 - i}`;
      daysList.push({ day: dayLabel, date: dateKey });
      activityMap[dateKey] = { commits: 0, prs: 0 };
    }

    let totalCommits = 0;
    let recentCommits7d = 0;
    let openIssues = 0;
    let openPRs = 0;
    let stalePRsCount = 0;
    const uniqueContributors = new Set<string>();
    const blockers: DashboardBlocker[] = [];

    const repoSummaries: DashboardRepoSummary[] = await Promise.all(
      topRepos.map(async (repo) => {
        const owner = repo.owner?.login || "user";
        const repoName = repo.name;

        const [commitsRaw, pullsRaw, contribsRaw] = await Promise.all([
          githubFetch<any[]>(
            `/repos/${owner}/${repoName}/commits?since=${sinceDateIso}&per_page=100`,
            cleanToken,
          ),
          githubFetch<any[]>(
            `/repos/${owner}/${repoName}/pulls?state=open&per_page=50`,
            cleanToken,
          ),
          githubFetch<any[]>(`/repos/${owner}/${repoName}/contributors?per_page=30`, cleanToken),
        ]);

        const commits = commitsRaw || [];
        const pulls = pullsRaw || [];
        const contribs = contribsRaw || [];

        const repoCommitsCount = commits.length;
        const repoPullsCount = pulls.length;

        totalCommits += repoCommitsCount;
        openPRs += repoPullsCount;

        for (const commit of commits) {
          const authorDate = commit.commit?.author?.date || commit.commit?.committer?.date;
          if (authorDate) {
            const dateKey = authorDate.split("T")[0];
            if (activityMap[dateKey]) activityMap[dateKey].commits += 1;
            if (new Date(authorDate) >= sevenDaysAgo) recentCommits7d += 1;
          }
        }

        for (const pr of pulls) {
          const prCreatedAt = pr.created_at;
          if (prCreatedAt) {
            const dateKey = prCreatedAt.split("T")[0];
            if (activityMap[dateKey]) activityMap[dateKey].prs += 1;
            const prDate = new Date(prCreatedAt);
            if (prDate < threeDaysAgo) {
              stalePRsCount += 1;
              if (blockers.length < 4) {
                blockers.push({
                  title: `PR #${pr.number}: ${pr.title.slice(0, 40)}...`,
                  priority:
                    prDate < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                      ? "Critical"
                      : "High",
                  impact: `Pending review in ${repoName} for >3 days`,
                  fix: `Assign reviewer or merge PR #${pr.number} into ${repo.default_branch || "main"}.`,
                  repo: repoName,
                });
              }
            }
          }
        }

        const pureIssues = Math.max(0, (repo.open_issues_count || 0) - repoPullsCount);
        openIssues += pureIssues;

        for (const ct of contribs) {
          if (ct.login) uniqueContributors.add(ct.login);
        }

        let status: "Healthy" | "Delayed" | "Blocked" = "Healthy";
        if (repoPullsCount > 5 || pureIssues > 8) status = "Delayed";
        if (commits.length === 0 && (repoPullsCount > 0 || pureIssues > 0)) status = "Blocked";

        const progressScore = Math.min(
          100,
          Math.max(25, Math.round(50 + commits.length * 2 - pureIssues * 3)),
        );
        const repoHealthScore = calculateHealthScore(
          pureIssues,
          pulls.filter((p) => new Date(p.created_at) < threeDaysAgo).length,
          commits.filter(
            (c) => new Date(c.commit?.author?.date || "").getTime() >= sevenDaysAgo.getTime(),
          ).length,
        );

        return {
          id: repoName,
          name: repoName,
          owner: owner,
          branch: repo.default_branch || "main",
          commits: repoCommitsCount,
          prs: repoPullsCount,
          issues: pureIssues,
          updated: formatRelativeTime(repo.updated_at || new Date().toISOString()),
          status,
          progress: progressScore,
          language: repo.language || "TypeScript",
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          health: repoHealthScore,
        };
      }),
    );

    if (blockers.length === 0) {
      if (openIssues > 0) {
        blockers.push({
          title: "Open issue backlog needs triage",
          priority: "Medium",
          impact: `${openIssues} unassigned issues across repositories`,
          fix: "Review and label open issues during next sprint grooming.",
          repo: topRepos[0]?.name || "general",
        });
      } else {
        blockers.push({
          title: "No active blockers detected",
          priority: "Medium",
          impact: "All pull requests and repositories are running smoothly",
          fix: "Keep monitoring daily commits and review requests.",
          repo: topRepos[0]?.name || "workspace",
        });
      }
    }

    const contributorsCount = Math.max(1, uniqueContributors.size);
    const healthScore = calculateHealthScore(openIssues, stalePRsCount, recentCommits7d);

    const activity: ActivityDay[] = daysList.map(({ day, date }) => ({
      day,
      date,
      commits: activityMap[date]?.commits || 0,
      prs: activityMap[date]?.prs || 0,
    }));

    const commitSparks = activity.slice(-10).map((a) => a.commits);
    const prSparks = activity.slice(-10).map((a) => a.prs);

    const stats: DashboardMetricStat[] = [
      {
        label: "Repositories",
        value: totalRepos,
        trend: 8,
        icon: "GitBranch",
        spark: [
          Math.max(1, totalRepos - 2),
          totalRepos - 1,
          totalRepos,
          totalRepos,
          totalRepos,
          totalRepos,
        ],
      },
      {
        label: "Commits (30d)",
        value: totalCommits,
        trend: 14,
        icon: "GitCommit",
        spark: commitSparks.length >= 7 ? commitSparks : [10, 15, 20, 25, 30, 28, totalCommits],
      },
      {
        label: "Open Issues",
        value: openIssues,
        trend: openIssues > 5 ? 6 : -4,
        icon: "CircleAlert",
        spark: [openIssues + 2, openIssues + 1, openIssues, openIssues, openIssues],
      },
      {
        label: "Open PRs",
        value: openPRs,
        trend: 4,
        icon: "GitPullRequest",
        spark: prSparks.length >= 5 ? prSparks : [2, 3, 4, 3, openPRs],
      },
      {
        label: "Active Contributors",
        value: contributorsCount,
        trend: 2,
        icon: "Users",
        spark: [1, 2, contributorsCount, contributorsCount, contributorsCount],
      },
      {
        label: "AI Blockers",
        value: blockers.length,
        trend: -1,
        icon: "ShieldAlert",
        spark: [2, 3, 2, blockers.length, blockers.length],
      },
    ];

    const heatmap: number[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 26 }, () => (Math.random() > 0.4 ? Math.floor(Math.random() * 5) : 0)),
    );

    const payload: DashboardDataResponse = {
      totalRepos,
      totalCommits,
      openIssues,
      openPRs,
      contributorsCount,
      healthScore,
      recentCommits7d,
      stalePRsCount,
      stats,
      activity,
      repositories: repoSummaries,
      blockers,
      heatmap,
    };

    dashboardCache.set(cacheKey, { data: payload, timestamp: Date.now() });

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=30",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: "Dashboard API Error",
        message: err.message || "Failed to aggregate dashboard metrics from GitHub.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

/**
 * Node / Connect middleware adapter for Vite dev server
 */
export async function nodeDashboardHandler(req: any, res: any) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  const protocol = req.socket?.encrypted ? "https" : "http";
  const host = req.headers.host || "localhost:8080";
  const fullUrl = `${protocol}://${host}${req.originalUrl || req.url}`;

  const reqHeaders = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) reqHeaders.set(key, Array.isArray(value) ? value.join(", ") : (value as string));
  }

  const webRequest = new Request(fullUrl, {
    method: req.method,
    headers: reqHeaders,
  });

  const response = await handleGetDashboard(webRequest);
  res.statusCode = response.status;
  response.headers.forEach((val, key) => {
    res.setHeader(key, val);
  });
  const body = await response.text();
  res.end(body);
}
