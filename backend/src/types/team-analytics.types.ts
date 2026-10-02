/**
 * Team Analytics shared types.
 * Used by backend services (github-team-analytics-api.ts, github-team-projects-api.ts).
 */

// ── Basic types ───────────────────────────────────────────────────────────────

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
  totalCommits: number;
  commitsInRange: number;
  pullRequests: number;
  mergedPullRequests: number;
  issuesOpened: number;
  issuesClosed: number;
  reviews: number | null;
  latestContribution: string | null;
  repositoryLastPushed: string | null;
  repositoryUpdated: string | null;
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
  updatedAt: string | null;
  pushedAt: string | null;
  archived: boolean;
}
