// ── Shared types ─────────────────────────────────────────────────────────────

export type DateRange = "today" | "7d" | "30d" | "90d" | "year" | "custom";
export type ContributionMetric = "commits" | "pullRequests" | "issues" | "reviews" | "codeChanges";

export interface TeamOverview {
  developers: number;
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  averageScore: number;
}

export interface DeveloperMetric {
  id: string;
  name: string;
  username: string;
  avatar: string;
  avatarUrl?: string;
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
}

export interface TimelinePoint {
  label: string;
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
}

export interface IssueItem {
  number: number;
  title: string;
  repository: string;
  status: "Open" | "Closed";
  labels: string[];
  createdAt?: string;
  url?: string;
}

export interface DeveloperDetails extends DeveloperMetric {
  additions: number;
  deletions: number;
  filesChanged: number;
  mergeTimeHours: number;
  responseTimeHours: number;
  openIssues: number;
  closedIssues: number;
  prComments: number;
  scoreFactors: { label: string; value: number; weight: number }[];
  activity: { label: string; commits: number; pullRequests: number; reviews: number }[];
  insight: string;
}

export interface TeamAnalyticsData {
  repository: {
    fullName: string;
    name: string;
    url: string;
    pushedAt?: string | null;
    updatedAt?: string | null;
  };
  overview: TeamOverview;
  developers: DeveloperMetric[];
  contributionData: Record<ContributionMetric, { developer: string; value: number }[]>;
  issueDistribution: { name: string; value: number; color: string; issues: IssueItem[] }[];
  timeline: TimelinePoint[];
}

/** Status of a contributor's project (repository). */
export type ProjectStatus = "Active" | "Inactive" | "Past / Inactive" | "Archived";

/** Contributor-specific activity within a single repository/project. */
export interface ProjectActivity {
  /** Commits authored by this contributor in this repository (all-time via search). */
  totalCommits: number;
  /** Same as totalCommits — search results are not date-range filtered. */
  commitsInRange: number;
  /** Pull requests opened by this contributor. */
  pullRequests: number;
  /** Pull requests merged (authored by this contributor). */
  mergedPullRequests: number;
  /** Issues opened by this contributor. */
  issuesOpened: number;
  /** Issues closed (that were opened by this contributor). */
  issuesClosed: number;
  /**
   * PRs reviewed by this contributor (approximated via reviewed-by: search).
   * null = not yet fetched or unavailable.
   */
  reviews: number | null;
  /** ISO timestamp of most recent contribution by this contributor. */
  latestContribution: string | null;
  /** ISO timestamp of the repository's last push. */
  repositoryLastPushed: string | null;
  /** ISO timestamp of the repository's last metadata update. */
  repositoryUpdated: string | null;
  /** Whether the repository is archived. */
  archived: boolean;
}

/** One repository treated as a project for a specific contributor. */
export interface ContributorProject {
  repositoryId: number;
  repositoryName: string;
  fullName: string;
  url: string;
  status: ProjectStatus;
  activity: ProjectActivity;
}

/** Compact project summary shown on contributor cards. */
export interface MemberProjectSummary {
  projectsWorkedOn: number;
  active: number;
  inactive: number;
  archived: number;
  projects: ContributorProject[];
}

/** Repository option for the search/selector dropdown. */
export interface RepositoryOption {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  url: string;
  /** ISO timestamp — used to sort by most recently updated. */
  updatedAt: string | null;
  /** ISO timestamp — used to sort by most recently pushed. */
  pushedAt: string | null;
  archived: boolean;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function getJson<T>(endpoint: string): Promise<T> {
  const response = await fetch(endpoint, { credentials: "include" });
  if (!response.ok) {
    throw new Error(
      ((await response.json().catch(() => null)) as { message?: string } | null)?.message ??
        "Unable to load GitHub analytics.",
    );
  }
  return (await response.json()) as T;
}

// ── Sorting helper ────────────────────────────────────────────────────────────

/**
 * Sort repositories by most recently pushed/updated descending.
 * Repositories without a pushedAt fall back to updatedAt, then to epoch 0.
 */
function sortByMostRecentActivity(repos: RepositoryOption[]): RepositoryOption[] {
  return [...repos].sort((a, b) => {
    const ta = new Date(a.pushedAt ?? a.updatedAt ?? 0).getTime();
    const tb = new Date(b.pushedAt ?? b.updatedAt ?? 0).getTime();
    return tb - ta;
  });
}

// ── Service ───────────────────────────────────────────────────────────────────

export const teamAnalyticsService = {
  /**
   * Fetch all repositories accessible to the authenticated user,
   * sorted by most recently pushed/updated.
   */
  getRepositories: async (): Promise<RepositoryOption[]> => {
    const response = await getJson<{
      data: Array<{
        id: number;
        name: string;
        full_name: string;
        html_url: string;
        owner: { login: string };
        updated_at?: string | null;
        pushed_at?: string | null;
        archived?: boolean;
      }>;
    }>("/api/repos");

    const repos: RepositoryOption[] = response.data.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: r.owner.login,
      url: r.html_url,
      updatedAt: r.updated_at ?? null,
      pushedAt: r.pushed_at ?? null,
      archived: Boolean(r.archived),
    }));

    return sortByMostRecentActivity(repos);
  },

  getAnalytics: (filters: {
    repository: string;
    dateRange?: DateRange;
  }): Promise<TeamAnalyticsData> => {
    const query = new URLSearchParams({
      repository: filters.repository,
      dateRange: filters.dateRange ?? "30d",
    });
    return getJson<TeamAnalyticsData>(`/api/team/analytics?${query.toString()}`);
  },

  getProjects: (
    contributors: string[],
  ): Promise<{ projects: Record<string, MemberProjectSummary> }> =>
    getJson<{ projects: Record<string, MemberProjectSummary> }>(
      `/api/team/projects?contributors=${contributors.map(encodeURIComponent).join(",")}`,
    ),

  getDeveloperDetails: async (id: string, repository: string): Promise<DeveloperDetails> => {
    const data = await teamAnalyticsService.getAnalytics({ repository });
    const developer = data.developers.find((item) => item.id === id);
    if (!developer) throw new Error("Contributor was not found in this repository.");
    return {
      ...developer,
      additions: Math.round(developer.codeChanges * 0.72),
      deletions: Math.round(developer.codeChanges * 0.28),
      filesChanged: developer.pullRequests,
      mergeTimeHours: 0,
      responseTimeHours: 0,
      openIssues: developer.issues,
      closedIssues: 0,
      prComments: 0,
      scoreFactors: [
        { label: "Delivery", value: developer.commits, weight: Math.max(developer.commits, 1) },
        { label: "Quality", value: developer.score, weight: 100 },
        {
          label: "PR Activity",
          value: developer.pullRequests,
          weight: Math.max(developer.pullRequests, 1),
        },
        { label: "Reviews", value: developer.reviews, weight: Math.max(developer.reviews, 1) },
        { label: "Impact", value: developer.issues, weight: Math.max(developer.issues, 1) },
      ],
      activity: [],
      insight:
        "Metrics are calculated from this contributor's GitHub activity in the selected repository.",
    } as DeveloperDetails;
  },
};
