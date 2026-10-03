/**
 * Dashboard API shared types (frontend-safe).
 * These mirror the types defined in backend/src/services/dashboard-api.ts
 */

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
