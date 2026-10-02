/**
 * Repository Detail API shared types (frontend-safe).
 * These mirror the types defined in backend/src/services/repo-detail-api.ts
 */

export interface ContributorDetail {
  login: string;
  name?: string;
  avatar_url: string;
  commits: number;
  prs: number;
  reviews: number;
  contributionPercent: number;
}

export interface ActivityPoint {
  date: string;
  label: string;
  commits: number;
  prs: number;
  issues: number;
}

export interface TimelineEvent {
  id: string;
  type: "commit" | "pr_merge" | "release" | "contributor" | "milestone";
  title: string;
  description: string;
  date: string;
  author?: {
    login: string;
    avatar_url: string;
  };
}

export interface RepoDetailResponse {
  overview: {
    name: string;
    full_name: string;
    owner: string;
    owner_avatar: string;
    description: string | null;
    visibility: "public" | "private";
    primaryLanguage: string;
    stars: number;
    forks: number;
    openIssues: number;
    contributorsCount: number;
    createdAt: string;
    updatedAt: string;
    pushedAt: string;
    defaultBranch: string;
    htmlUrl: string;
    license: string | null;
  };
  healthScore: {
    overall: number;
    status: "Healthy" | "Attention" | "At Risk";
    pillars: {
      maintainability: number;
      activity: number;
      collaboration: number;
      issueManagement: number;
      documentation: number;
    };
  };
  activity: {
    timeframe: "7d" | "30d" | "3m" | "6m" | "1y";
    data: ActivityPoint[];
    totalCommitsPeriod: number;
    totalPRsPeriod: number;
    linesChangedEstimate: number;
  };
  contributors: {
    list: ContributorDetail[];
    aiInsight: string;
  };
  prAnalytics: {
    openPRs: number;
    closedPRs: number;
    mergedPRs: number;
    avgMergeTimeDays: number;
    mergeSuccessRate: number;
  };
  issueAnalytics: {
    openIssues: number;
    closedIssues: number;
    avgResolutionTimeDays: number;
    highPriorityIssues: number;
    issueResolutionRate: number;
  };
  aiInsights: {
    summary: string;
    strengths: string[];
    concerns: string[];
    recommendations: string[];
  };
  technology: {
    languages: { name: string; percentage: number; color: string }[];
    frameworks: string[];
    largestDirectories: string[];
    codeQualityInsight: string;
  };
  timeline: TimelineEvent[];
}
