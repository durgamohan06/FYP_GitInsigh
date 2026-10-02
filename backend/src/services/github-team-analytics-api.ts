import { extractGitHubToken } from "./github-api";
import { calculateContributorScore } from "../utils/contributor-scoring";

export interface TeamAnalyticsApiData {
  repository: {
    fullName: string;
    name: string;
    url: string;
    pushedAt: string | null;
    updatedAt: string | null;
  };
  overview: {
    developers: number;
    commits: number;
    pullRequests: number;
    issues: number;
    reviews: number;
    averageScore: number;
  };
  developers: Array<{
    id: string;
    name: string;
    username: string;
    avatar: string;
    avatarUrl: string;
    role: string;
    score: number;
    grade: string;
    commits: number;
    issues: number;
    pullRequests: number;
    reviews: number;
    aiActivityScore: number;
    codeChanges: number;
    mergedPullRequests: number;
  }>;
  contributionData: Record<string, { developer: string; value: number }[]>;
  issueDistribution: { name: string; value: number; color: string; issues: unknown[] }[];
  timeline: {
    label: string;
    commits: number;
    pullRequests: number;
    issues: number;
    reviews: number;
  }[];
}

type GitHubContributor = {
  login: string;
  avatar_url?: string;
  contributions?: number;
  html_url?: string;
};
type GitHubPull = {
  number: number;
  user?: { login?: string };
  state?: string;
  merged_at?: string | null;
  created_at?: string;
  additions?: number;
  deletions?: number;
  changed_files?: number;
};
type GitHubIssue = {
  number: number;
  title: string;
  user?: { login?: string };
  state?: "open" | "closed";
  labels?: { name?: string }[];
  created_at?: string;
  html_url?: string;
  pull_request?: unknown;
};
type GitHubReview = { user?: { login?: string } };
type GitHubRepoInfo = {
  full_name: string;
  name: string;
  html_url: string;
  pushed_at: string | null;
  updated_at: string | null;
};

const colors = [
  "var(--color-danger)",
  "var(--color-brand)",
  "var(--color-warning)",
  "var(--color-accent-cyan)",
];
const categories = ["Bugs", "Features", "Chores", "Documentation"];

function githubHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "GitInsight-AI",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, { headers: githubHeaders(token) });
  if (response.status === 202) {
    // GitHub is still computing statistics — return empty array/object as fallback
    return [] as unknown as T;
  }
  if (!response.ok) throw new Error(`GitHub API returned ${response.status} for ${path}`);
  return (await response.json()) as T;
}

function initials(login: string) {
  return login.slice(0, 2).toUpperCase();
}
function grade(score: number) {
  return score >= 95 ? "A+" : score >= 85 ? "A" : score >= 75 ? "B+" : score >= 65 ? "B" : "C";
}
function issueCategory(issue: GitHubIssue) {
  const labels = (issue.labels ?? []).map((label) => label.name?.toLowerCase() ?? "");
  if (labels.some((l) => l.includes("bug") || l.includes("fix"))) return "Bugs";
  if (labels.some((l) => l.includes("feature") || l.includes("enhancement"))) return "Features";
  if (labels.some((l) => l.includes("doc"))) return "Documentation";
  return "Chores";
}
function dateStart(range: string) {
  const days =
    range === "today" ? 1 : range === "7d" ? 7 : range === "90d" ? 90 : range === "year" ? 365 : 30;
  return new Date(Date.now() - days * 86400000).toISOString();
}

export async function handleGetTeamAnalytics(request: Request): Promise<Response> {
  if (request.method !== "GET")
    return Response.json({ error: "Method Not Allowed" }, { status: 405 });

  const token = extractGitHubToken(request);
  if (!token) {
    return Response.json(
      { error: "Unauthorized", message: "Connect GitHub to load contributors." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const repository = url.searchParams.get("repository") ?? "";
  const range = url.searchParams.get("dateRange") ?? "30d";

  if (!repository || !repository.includes("/")) {
    return Response.json(
      { error: "A repository in owner/name format is required." },
      { status: 400 },
    );
  }

  const [owner, repo] = repository.split("/");

  try {
    const since = dateStart(range);

    const [repoInfo, contributors, pulls, issues] = await Promise.all([
      githubJson<GitHubRepoInfo>(`/repos/${owner}/${repo}`, token),
      githubJson<GitHubContributor[]>(
        `/repos/${owner}/${repo}/contributors?anon=false&per_page=100`,
        token,
      ),
      githubJson<GitHubPull[]>(
        `/repos/${owner}/${repo}/pulls?state=all&sort=created&direction=desc&per_page=100`,
        token,
      ),
      githubJson<GitHubIssue[]>(
        `/repos/${owner}/${repo}/issues?state=all&since=${encodeURIComponent(since)}&per_page=100`,
        token,
      ),
    ]);

    // Ensure contributors is an array (202 fallback returns [])
    const contributorList = Array.isArray(contributors) ? contributors : [];
    const pullList = Array.isArray(pulls) ? pulls : [];
    const issueList = Array.isArray(issues) ? issues : [];

    const contributorLogins = new Set(contributorList.map((c) => c.login));
    const pureIssues = issueList.filter((issue) => !issue.pull_request);

    // Accumulate reviews per contributor login
    const reviewsByLogin = new Map<string, number>();

    const pullMetrics = await Promise.all(
      pullList.slice(0, 100).map(async (pull) => {
        const detail = await githubJson<GitHubPull>(
          `/repos/${owner}/${repo}/pulls/${pull.number}`,
          token,
        ).catch(() => pull);
        const reviews = await githubJson<GitHubReview[]>(
          `/repos/${owner}/${repo}/pulls/${pull.number}/reviews`,
          token,
        ).catch(() => [] as GitHubReview[]);

        const reviewList = Array.isArray(reviews) ? reviews : [];
        for (const review of reviewList) {
          const login = review.user?.login;
          if (login && contributorLogins.has(login)) {
            reviewsByLogin.set(login, (reviewsByLogin.get(login) ?? 0) + 1);
          }
        }
        return { pull, detail };
      }),
    );

    // Build per-contributor metrics — every field is filtered to that contributor's login
    const developers = contributorList.map((contributor) => {
      const login = contributor.login;

      // PRs authored by this contributor
      const myPulls = pullMetrics.filter(({ pull }) => pull.user?.login === login);
      const pullRequests = myPulls.length;
      const mergedPullRequests = myPulls.filter(({ pull }) => Boolean(pull.merged_at)).length;

      // Issues authored by this contributor (already date-filtered via `since`)
      const issues = pureIssues.filter((issue) => issue.user?.login === login).length;

      // Reviews performed by this contributor
      const reviews = reviewsByLogin.get(login) ?? 0;

      // Code additions + deletions from PRs authored by this contributor
      const codeChanges = myPulls.reduce(
        (total, { detail }) => total + (detail.additions ?? 0) + (detail.deletions ?? 0),
        0,
      );

      // Commits: GitHub contributors endpoint gives all-time commits for this contributor in this repo
      // This is per-contributor scoped to the repo — correct.
      const commits = contributor.contributions ?? 0;

      const score = calculateContributorScore({ commits, pullRequests, issues, reviews });

      return {
        id: login,
        name: login,
        username: login,
        avatar: initials(login),
        avatarUrl: contributor.avatar_url ?? "",
        role: "GitHub Contributor",
        score,
        grade: grade(score),
        commits,
        issues,
        pullRequests,
        reviews,
        aiActivityScore: 0,
        codeChanges,
        mergedPullRequests,
      };
    });

    const sum = (key: "commits" | "issues" | "pullRequests" | "reviews") =>
      developers.reduce((total, dev) => total + dev[key], 0);

    const issueDistribution = categories.map((name, index) => ({
      name,
      color: colors[index],
      issues: pureIssues
        .filter((issue) => issueCategory(issue) === name)
        .map((issue) => ({
          number: issue.number,
          title: issue.title,
          repository: repoInfo.name,
          status: issue.state === "open" ? "Open" : "Closed",
          labels: (issue.labels ?? []).map((l) => l.name),
          createdAt: issue.created_at,
          url: issue.html_url,
        })),
      value: pureIssues.filter((issue) => issueCategory(issue) === name).length,
    }));

    const timeline = Array.from({ length: 4 }, (_, index) => ({
      label: `${3 - index}M ago`,
      commits: Math.round(sum("commits") / 4),
      pullRequests: Math.round(sum("pullRequests") / 4),
      issues: Math.round(sum("issues") / 4),
      reviews: Math.round(sum("reviews") / 4),
    })).reverse();

    const contributionData = Object.fromEntries(
      (["commits", "pullRequests", "issues", "reviews", "codeChanges"] as const).map((key) => [
        key,
        developers.map((dev) => ({ developer: dev.name, value: dev[key] })),
      ]),
    );

    const payload: TeamAnalyticsApiData = {
      repository: {
        fullName: repoInfo.full_name,
        name: repoInfo.name,
        url: repoInfo.html_url,
        pushedAt: repoInfo.pushed_at ?? null,
        updatedAt: repoInfo.updated_at ?? null,
      },
      overview: {
        developers: developers.length,
        commits: sum("commits"),
        pullRequests: sum("pullRequests"),
        issues: sum("issues"),
        reviews: sum("reviews"),
        averageScore: developers.length
          ? Math.round(developers.reduce((total, dev) => total + dev.score, 0) / developers.length)
          : 0,
      },
      developers,
      contributionData,
      issueDistribution,
      timeline,
    };

    return Response.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      {
        error: "GitHub API Error",
        message: error instanceof Error ? error.message : "Unable to load repository analytics.",
      },
      { status: 502 },
    );
  }
}
