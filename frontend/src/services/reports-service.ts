import type { TeamAnalyticsData } from "./team-analytics-service";

export type ReportType = "Team Performance" | "Repository Health" | "AI Insights" | "Project Summary" | "Developer Performance";
export type ReportStatus = "Ready" | "Generating" | "Failed";

export interface ReportRecord {
  id: string;
  userId: string;
  repositoryId: string;
  reportType: ReportType;
  name: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  status: ReportStatus;
  fileUrl?: string;
  developers: number;
  repositories: number;
  repositoryName?: string;
  metrics?: { commits: number; pullRequests: number; issues: number; reviews: number };
}

export interface ReportRequest {
  reportType: ReportType;
  repositoryId: string;
  period: string;
  include: Record<string, boolean>;
}

const storageKey = "gitinsight-reports";
function loadReports(): ReportRecord[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; }
}
function saveReports(reports: ReportRecord[]) { if (typeof window !== "undefined") localStorage.setItem(storageKey, JSON.stringify(reports)); }

async function request<T>(endpoint: string, options: RequestInit, fallback: T): Promise<T> {
  try { const response = await fetch(endpoint, options); if (response.ok) return (await response.json()) as T; } catch { /* fallback */ }
  return fallback;
}

export const reportsService = {
  async list() { return request("/api/reports", {}, loadReports()); },
  async generate(requestData: ReportRequest, analytics: TeamAnalyticsData): Promise<ReportRecord> {
    const now = new Date();
    const fallback: ReportRecord = { id: `report-${now.getTime()}`, userId: "demo-user", repositoryId: requestData.repositoryId, reportType: requestData.reportType, name: `${requestData.reportType} Report`, periodStart: requestData.period === "Last 30 days" ? "Last 30 days" : requestData.period, periodEnd: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), generatedAt: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), status: "Ready", developers: analytics.overview.developers, repositories: 1, repositoryName: analytics.repository.fullName, metrics: { commits: analytics.overview.commits, pullRequests: analytics.overview.pullRequests, issues: analytics.overview.issues, reviews: analytics.overview.reviews } };
    const created = await request("/api/reports/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestData) }, fallback);
    const reports = [created, ...loadReports().filter((item) => item.id !== created.id)];
    saveReports(reports);
    return created;
  },
  save: saveReports,
};
