import { extractGitHubToken, type SimplifiedRepo } from "./github-api";
import type {
  ContributorProject,
  MemberProjectSummary,
  ProjectStatus,
} from "../types/team-analytics.types";

// ── GitHub Search API types ──────────────────────────────────────────────────

type SearchCommitItem = {
  html_url?: string;
  commit?: { author?: { date?: string } };
  repository?: { full_name?: string };
};
type SearchIssueItem = {
  repository_url?: string;
  html_url?: string;
  created_at?: string;
  closed_at?: string | null;
  user?: { login?: string };
  pull_request?: { merged_at?: string | null };
  repository?: { full_name?: string };
};
type SearchCommitResponse = { total_count: number; items: SearchCommitItem[] };
type SearchIssueResponse = { total_count: number; items: SearchIssueItem[] };

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(value: string | null | undefined): number {
  return value ? (Date.now() - new Date(value).getTime()) / 86400000 : Number.POSITIVE_INFINITY;
}

function projectStatus(repo: SimplifiedRepo, latestContribution: string | null): ProjectStatus {
  if (repo.archived) return "Archived";
  const age = daysSince(latestContribution);
  if (age <= 30) return "Active";
  if (age <= 90) return "Inactive";
  return "Past / Inactive";
}

function extractFullName(item: SearchIssueItem): string | null {
  if (item.repository?.full_name) return item.repository.full_name;
  const repoUrl = item.repository_url ?? "";
  const match = repoUrl.match(/\/repos\/(.+)$/);
  return match ? match[1] : null;
}

/**
 * Fetch GitHub JSON with correct headers for each endpoint type.
 * Returns null (rather than throwing) for expected non-fatal HTTP codes.
 */
async function githubFetch<T>(
  path: string,
  token: string,
  extraHeaders: Record<string, string> = {},
): Promise<T | null> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "GitInsight-AI",
      "X-GitHub-Api-Version": "2022-11-28",
      ...extraHeaders,
    },
  });

  // 202 — GitHub is still computing statistics; treat as empty
  if (response.status === 202) return null;
  // 403 rate-limit / forbidden, 404 not found, 422 validation — swallow gracefully
  if (response.status === 403 || response.status === 404 || response.status === 422) return null;

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} on ${path}`);
  }
  return (await response.json()) as T;
}

async function searchCommits(login: string, token: string): Promise<SearchCommitResponse> {
  // Commit search requires the cloak-preview media type
  const result = await githubFetch<SearchCommitResponse>(
    `/search/commits?q=author:${encodeURIComponent(login)}&sort=author-date&order=desc&per_page=100`,
    token,
    { Accept: "application/vnd.github.cloak-preview+json" },
  );
  return result ?? { total_count: 0, items: [] };
}

async function searchPullRequests(login: string, token: string): Promise<SearchIssueResponse> {
  const result = await githubFetch<SearchIssueResponse>(
    `/search/issues?q=author:${encodeURIComponent(login)}+type:pr&sort=created&order=desc&per_page=100`,
    token,
  );
  return result ?? { total_count: 0, items: [] };
}

async function searchIssues(login: string, token: string): Promise<SearchIssueResponse> {
  const result = await githubFetch<SearchIssueResponse>(
    `/search/issues?q=author:${encodeURIComponent(login)}+-type:pr&sort=created&order=desc&per_page=100`,
    token,
  );
  return result ?? { total_count: 0, items: [] };
}

/**
 * Count PRs that the contributor reviewed (not authored).
 * Uses reviewed-by: qualifier — returns PR items, not review events.
 */
async function searchReviewedPRs(login: string, token: string): Promise<SearchIssueResponse> {
  const result = await githubFetch<SearchIssueResponse>(
    `/search/issues?q=reviewed-by:${encodeURIComponent(login)}+type:pr&sort=created&order=desc&per_page=100`,
    token,
  );
  return result ?? { total_count: 0, items: [] };
}

// ── Per-repo activity accumulator ────────────────────────────────────────────

interface RepoActivity {
  commits: number;
  pulls: number;
  merged: number;
  issuesOpened: number;
  issuesClosed: number;
  reviews: number;
  latestContribution: string | null;
}

function blank(): RepoActivity {
  return {
    commits: 0,
    pulls: 0,
    merged: 0,
    issuesOpened: 0,
    issuesClosed: 0,
    reviews: 0,
    latestContribution: null,
  };
}

function updateLatest(current: string | null, candidate: string | null | undefined): string | null {
  if (!candidate) return current;
  if (!current || candidate > current) return candidate;
  return current;
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function handleGetTeamProjects(request: Request): Promise<Response> {
  const token = extractGitHubToken(request);
  if (!token) {
    return Response.json(
      { error: "Unauthorized", message: "Connect GitHub to load project history." },
      { status: 401 },
    );
  }

  const logins = [
    ...new Set(
      (new URL(request.url).searchParams.get("contributors") ?? "")
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
    ),
  ];

  if (!logins.length) return Response.json({ projects: {} });

  try {
    // Fetch all repos accessible to the authenticated user (owned + collaborated)
    const repos: SimplifiedRepo[] = await githubFetch<SimplifiedRepo[]>(
      "/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member",
      token,
    ).then(
      (r) =>
        r ??
        githubFetch<SimplifiedRepo[]>("/user/repos?sort=updated&per_page=100", token).then(
          (fallback) => fallback ?? [],
        ),
    );

    const repoByFullName = new Map<string, SimplifiedRepo>(repos.map((r) => [r.full_name, r]));

    const projects: Record<string, MemberProjectSummary> = {};

    for (const login of logins) {
      // Run all four searches in parallel — each gracefully returns empty on error
      const [commitSearch, pullSearch, issueSearch, reviewSearch] = await Promise.all([
        searchCommits(login, token),
        searchPullRequests(login, token),
        searchIssues(login, token),
        searchReviewedPRs(login, token),
      ]);

      const byRepo = new Map<string, RepoActivity>();

      // ── Commits ────────────────────────────────────────────────────────────
      for (const item of commitSearch.items) {
        const fullName = item.repository?.full_name;
        if (!fullName) continue;
        const act = byRepo.get(fullName) ?? blank();
        act.commits++;
        act.latestContribution = updateLatest(act.latestContribution, item.commit?.author?.date);
        byRepo.set(fullName, act);
      }

      // ── Pull Requests (authored) ───────────────────────────────────────────
      for (const item of pullSearch.items) {
        const fullName = extractFullName(item);
        if (!fullName) continue;
        const act = byRepo.get(fullName) ?? blank();
        act.pulls++;
        // merged_at present on the pull_request sub-object from search results
        if (item.pull_request?.merged_at) act.merged++;
        act.latestContribution = updateLatest(act.latestContribution, item.created_at);
        byRepo.set(fullName, act);
      }

      // ── Issues (authored) ──────────────────────────────────────────────────
      for (const item of issueSearch.items) {
        const fullName = extractFullName(item);
        if (!fullName) continue;
        const act = byRepo.get(fullName) ?? blank();
        act.issuesOpened++;
        if (item.closed_at) act.issuesClosed++;
        act.latestContribution = updateLatest(act.latestContribution, item.created_at);
        byRepo.set(fullName, act);
      }

      // ── Reviews (PRs reviewed by contributor, not authored) ────────────────
      for (const item of reviewSearch.items) {
        const fullName = extractFullName(item);
        if (!fullName) continue;
        const act = byRepo.get(fullName) ?? blank();
        act.reviews++;
        act.latestContribution = updateLatest(act.latestContribution, item.created_at);
        byRepo.set(fullName, act);
      }

      // ── Build ContributorProject list ──────────────────────────────────────
      const memberProjects: ContributorProject[] = [];

      for (const [fullName, activity] of byRepo) {
        // Only include repos that are in the authenticated user's accessible set
        const repo = repoByFullName.get(fullName);
        if (!repo) continue;

        // Meaningful activity check: must have at least one real action
        const hasMeaningfulActivity =
          activity.commits > 0 ||
          activity.pulls > 0 ||
          activity.issuesOpened > 0 ||
          activity.reviews > 0;
        if (!hasMeaningfulActivity) continue;

        memberProjects.push({
          repositoryId: repo.id,
          repositoryName: repo.name,
          fullName: repo.full_name,
          url: repo.html_url,
          status: projectStatus(repo, activity.latestContribution),
          activity: {
            totalCommits: activity.commits,
            commitsInRange: activity.commits, // search results are not date-filtered per range
            pullRequests: activity.pulls,
            mergedPullRequests: activity.merged,
            issuesOpened: activity.issuesOpened,
            issuesClosed: activity.issuesClosed,
            reviews: activity.reviews,
            latestContribution: activity.latestContribution,
            repositoryLastPushed: repo.pushed_at ?? null,
            repositoryUpdated: repo.updated_at ?? null,
            archived: Boolean(repo.archived),
          },
        });
      }

      // Sort by most recently active first
      memberProjects.sort(
        (a, b) =>
          daysSince(a.activity.latestContribution) - daysSince(b.activity.latestContribution),
      );

      projects[login] = {
        projectsWorkedOn: memberProjects.length,
        active: memberProjects.filter((p) => p.status === "Active").length,
        inactive: memberProjects.filter(
          (p) => p.status === "Inactive" || p.status === "Past / Inactive",
        ).length,
        archived: memberProjects.filter((p) => p.status === "Archived").length,
        projects: memberProjects,
      };
    }

    return Response.json({ projects }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      {
        error: "GitHub API Error",
        message: error instanceof Error ? error.message : "Unable to load project history.",
      },
      { status: 502 },
    );
  }
}
