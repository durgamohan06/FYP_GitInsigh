import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, Badge, Button, CircularProgress } from "@/components/ui-bits";
import type { RepoDetailResponse } from "@/lib/repo-detail-api";
import {
  Star,
  GitFork,
  GitBranch,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Users,
  GitPullRequest,
  CircleAlert,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Code2,
  Clock,
  Layers,
  FileCode2,
  Calendar,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/repositories/$id")({
  head: ({ params }) => ({ meta: [{ title: `${params.id} · Repository Analytics · GitInsight AI` }] }),
  component: RepoDetail,
});

type TimeframeOption = "7d" | "30d" | "3m" | "6m" | "1y";

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
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  return `${Math.floor(diffInDays / 365)}y ago`;
}

function RepoDetail() {
  const { id } = Route.useParams();
  const [data, setData] = useState<RepoDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("30d");

  const fetchDetail = async (targetTimeframe: TimeframeOption = timeframe) => {
    setLoading(true);
    setError(null);

    let owner = "RAVI252000";
    let repo = id;

    if (id.includes("/")) {
      const parts = id.split("/");
      owner = parts[0];
      repo = parts[1];
    } else if (id.includes("--")) {
      const parts = id.split("--");
      owner = parts[0];
      repo = parts[1];
    } else if (id.toLowerCase() === "git-fyp") {
      owner = "durgamohan06";
      repo = "Git-fyp";
    } else {
      try {
        const repoListRes = await fetch("/api/repos", { credentials: "include" });
        if (repoListRes.ok) {
          const listJson = await repoListRes.json();
          const all = [
            ...(listJson.ownedRepos || []),
            ...(listJson.collaboratedRepos || []),
            ...(listJson.repos || []),
          ];
          const matched = all.find(
            (r: any) =>
              r.name?.toLowerCase() === id.toLowerCase() ||
              r.full_name?.toLowerCase() === id.toLowerCase()
          );
          if (matched && matched.owner?.login) {
            owner = matched.owner.login;
            repo = matched.name;
          }
        }
      } catch {}
    }

    try {
      const res = await fetch(
        `/api/repos/detail?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&timeframe=${targetTimeframe}&_t=${Date.now()}`,
        { credentials: "include" }
      );
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || json.error || `HTTP ${res.status}: Failed to load repository analytics.`);
      }

      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load repository details from GitHub API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail(timeframe);
  }, [id, timeframe]);

  if (loading && !data) {
    return (
      <AppShell>
        <div className="mb-4">
          <Link to="/repositories" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Repositories
          </Link>
        </div>
        <div className="space-y-6">
          <Card className="p-8 h-40 animate-pulse bg-muted/40" lift={false}>
            <div className="h-full w-full" />
          </Card>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-6 h-72 animate-pulse bg-muted/40" lift={false}>
              <div className="h-full w-full" />
            </Card>
            <Card className="p-6 h-72 lg:col-span-2 animate-pulse bg-muted/40" lift={false}>
              <div className="h-full w-full" />
            </Card>
          </div>
          <Card className="p-8 h-80 animate-pulse bg-muted/40" lift={false}>
            <div className="h-full w-full" />
          </Card>
        </div>
      </AppShell>
    );
  }

  if (error && !data) {
    return (
      <AppShell>
        <div className="mb-4">
          <Link to="/repositories" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Repositories
          </Link>
        </div>
        <Card className="p-10 text-center border-danger/40 bg-danger/5" lift={false}>
          <div className="h-12 w-12 rounded-2xl bg-danger/10 text-danger mx-auto grid place-items-center mb-3">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Repository Analysis Failed</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-5">{error}</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => fetchDetail()}>
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
            <Link to="/repositories">
              <Button variant="secondary">Browse All Repositories</Button>
            </Link>
          </div>
        </Card>
      </AppShell>
    );
  }

  const { overview, healthScore, activity, contributors, prAnalytics, issueAnalytics, aiInsights, technology, timeline } = data!;

  return (
    <AppShell>
      {/* Navigation Breadcrumb */}
      <div className="mb-3">
        <Link
          to="/repositories"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Repositories
        </Link>
      </div>

      {/* 1. Repository Overview Header */}
      <div className="mb-6 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {overview.owner_avatar && (
              <img
                src={overview.owner_avatar}
                alt={overview.owner}
                className="h-14 w-14 rounded-2xl ring-2 ring-border/80 shrink-0"
              />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-sm font-medium text-muted-foreground">{overview.owner} /</span>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{overview.name}</h1>
                <Badge tone={overview.visibility === "private" ? "warning" : "success"}>
                  {overview.visibility === "private" ? "Private" : "Public"}
                </Badge>
                <Badge tone="brand">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand mr-1" />
                  {overview.primaryLanguage}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl">
                {overview.description || "No description provided for this repository."}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-3">
                <span className="inline-flex items-center gap-1">
                  <GitBranch className="h-3.5 w-3.5 text-brand" /> {overview.defaultBranch}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-400" /> {overview.stars} stars
                </span>
                <span className="inline-flex items-center gap-1">
                  <GitFork className="h-3.5 w-3.5 text-foreground" /> {overview.forks} forks
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-purple-400" /> {overview.contributorsCount} contributors
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Updated {formatRelativeTime(overview.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a href={overview.htmlUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary">
                <ExternalLink className="h-4 w-4" /> View on GitHub
              </Button>
            </a>
            <Button onClick={() => fetchDetail()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Sync / Analyze
            </Button>
          </div>
        </div>
      </div>

      {/* Grid: Health Score & Key Metrics */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* 2. Repository Health Score Card ⭐ */}
        <Card className="p-6 flex flex-col justify-between" lift={false}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-base text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-brand" /> Repository Health Score
                </h3>
                <p className="text-xs text-muted-foreground">Multi-factor vital metrics evaluation</p>
              </div>
              <Badge tone={healthScore.status === "Healthy" ? "success" : healthScore.status === "Attention" ? "warning" : "danger"}>
                {healthScore.status}
              </Badge>
            </div>

            <div className="flex items-center justify-center my-4">
              <CircularProgress
                value={healthScore.overall}
                size={140}
                stroke={12}
                label={`${healthScore.overall}/100`}
              />
            </div>

            {/* 5-Pillar Score Breakdown */}
            <div className="space-y-2.5 mt-4 pt-3 border-t border-border">
              {[
                { label: "Maintainability", score: healthScore.pillars.maintainability, tone: "brand" },
                { label: "Activity Velocity", score: healthScore.pillars.activity, tone: "success" },
                { label: "Collaboration", score: healthScore.pillars.collaboration, tone: "purple" },
                { label: "Issue Management", score: healthScore.pillars.issueManagement, tone: "amber" },
                { label: "Documentation", score: healthScore.pillars.documentation, tone: "cyan" },
              ].map((p) => (
                <div key={p.label} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground">{p.label}</span>
                    <span className="font-semibold text-foreground">{p.score}/100</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-500"
                      style={{ width: `${p.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 6. AI Insights Card 🤖 (Key Differentiator) */}
        <Card className="p-6 lg:col-span-2 flex flex-col justify-between border-brand/40 bg-brand/[0.02]" lift={false}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand grid place-items-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-foreground">AI Repository Intelligence</h3>
                  <p className="text-xs text-muted-foreground">Automated synthesis & risk assessment</p>
                </div>
              </div>
              <Badge tone="brand">GitInsight AI</Badge>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border/80 text-xs text-foreground/90 leading-relaxed mb-4">
              {aiInsights.summary}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {/* Strengths */}
              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
                </div>
                <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc list-inside">
                  {aiInsights.strengths.map((s, i) => (
                    <li key={i} className="leading-snug">{s}</li>
                  ))}
                </ul>
              </div>

              {/* Concerns */}
              <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" /> Concerns
                </div>
                <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc list-inside">
                  {aiInsights.concerns.map((c, i) => (
                    <li key={i} className="leading-snug">{c}</li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="p-3.5 rounded-xl border border-brand/20 bg-brand/5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-brand">
                  <Lightbulb className="h-3.5 w-3.5" /> Recommendations
                </div>
                <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc list-inside">
                  {aiInsights.recommendations.map((r, i) => (
                    <li key={i} className="leading-snug">{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Evaluated across {overview.stars} stars, {activity.totalCommitsPeriod} recent commits, and {prAnalytics.openPRs} open PRs.</span>
          </div>
        </Card>
      </div>

      {/* 3. Development Activity Charts Section */}
      <Card className="p-6 mb-6" lift={false}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand" /> Development Activity Over Time
            </h3>
            <p className="text-xs text-muted-foreground">
              Commits, Pull Requests, and Issues trajectory
            </p>
          </div>

          {/* Timeframe Switcher Buttons */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border text-xs">
            {(["7d", "30d", "3m", "6m", "1y"] as TimeframeOption[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  timeframe === tf
                    ? "bg-brand text-brand-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                }`}
              >
                {tf === "7d" ? "7 Days" : tf === "30d" ? "30 Days" : tf === "3m" ? "3 Months" : tf === "6m" ? "6 Months" : "1 Year"}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activity.data} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="commitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="commits" name="Commits" stroke="var(--color-brand)" strokeWidth={2.2} fill="url(#commitGrad)" />
              <Area type="monotone" dataKey="prs" name="Pull Requests" stroke="#a855f7" strokeWidth={2} fill="url(#prGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand" /> Commits in Period: <strong className="text-foreground">{activity.totalCommitsPeriod}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> PRs Opened: <strong className="text-foreground">{activity.totalPRsPeriod}</strong>
            </span>
          </div>
          <span>Estimated Lines Changed: <strong className="text-foreground">~{activity.linesChangedEstimate.toLocaleString()}</strong></span>
        </div>
      </Card>

      {/* Grid: 4. Contributors Leaderboard & 5. PR/Issue Analytics */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* 4. Contributors Leaderboard */}
        <Card className="p-6 flex flex-col justify-between" lift={false}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand" /> Contributors Leaderboard
                </h3>
                <p className="text-xs text-muted-foreground">Active developer workload distribution</p>
              </div>
              <Badge tone="brand">{contributors.list.length} Contributors</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-3 py-2 rounded-l-lg">Contributor</th>
                    <th className="text-center font-medium px-3 py-2">Commits</th>
                    <th className="text-center font-medium px-3 py-2">PRs</th>
                    <th className="text-right font-medium px-3 py-2 rounded-r-lg">Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {contributors.list.map((c) => (
                    <tr key={c.login} className="hover:bg-accent/40 transition">
                      <td className="px-3 py-2.5 font-medium flex items-center gap-2">
                        <img src={c.avatar_url} alt={c.login} className="h-6 w-6 rounded-full ring-1 ring-border" />
                        <span className="truncate max-w-[120px]">{c.login}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-foreground font-semibold">{c.commits}</td>
                      <td className="px-3 py-2.5 text-center text-muted-foreground">{c.prs}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold text-foreground">{c.contributionPercent}%</span>
                          <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-brand rounded-full" style={{ width: `${c.contributionPercent}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Contributor Observation */}
          <div className="mt-4 pt-3 border-t border-border">
            <div className="p-2.5 rounded-lg bg-brand/5 border border-brand/20 text-xs text-muted-foreground leading-relaxed">
              💡 {contributors.aiInsight}
            </div>
          </div>
        </Card>

        {/* 5. Pull Request & Issue Analytics */}
        <div className="space-y-6">
          {/* PR Metrics Card */}
          <Card className="p-5" lift={false}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <GitPullRequest className="h-4 w-4 text-purple-400" /> Pull Request Analytics
              </h3>
              <Badge tone="brand">Avg {prAnalytics.avgMergeTimeDays}d to merge</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-muted/40">
                <div className="text-lg font-bold text-foreground">{prAnalytics.openPRs}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Open PRs</div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <div className="text-lg font-bold text-purple-400">{prAnalytics.mergedPRs}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Merged PRs</div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <div className="text-lg font-bold text-emerald-400">{prAnalytics.mergeSuccessRate}%</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Merge Success Rate</div>
              </div>
            </div>
          </Card>

          {/* Issue Metrics Card */}
          <Card className="p-5" lift={false}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <CircleAlert className="h-4 w-4 text-amber-400" /> Issue Management Analytics
              </h3>
              <Badge tone="warning">Avg {issueAnalytics.avgResolutionTimeDays}d resolution</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-muted/40">
                <div className="text-lg font-bold text-foreground">{issueAnalytics.openIssues}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Open Issues</div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <div className="text-lg font-bold text-emerald-400">{issueAnalytics.closedIssues}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Closed Issues</div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <div className="text-lg font-bold text-brand">{issueAnalytics.issueResolutionRate}%</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Resolution Rate</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Grid: 7. Technology Stack & 8. Visual Activity Timeline */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* 7. Code & Technology Stack Overview */}
        <Card className="p-6 flex flex-col justify-between" lift={false}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-brand" /> Technology & Language Composition
                </h3>
                <p className="text-xs text-muted-foreground">Codebase language breakdown & dependencies</p>
              </div>
              <Badge tone="default">GitHub Linguistic</Badge>
            </div>

            {/* Language Percentage Bar */}
            <div className="h-3 w-full rounded-full overflow-hidden flex mb-4 bg-muted">
              {technology.languages.map((l) => (
                <div
                  key={l.name}
                  style={{ width: `${l.percentage}%`, backgroundColor: l.color }}
                  title={`${l.name}: ${l.percentage}%`}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mb-5">
              {technology.languages.map((l) => (
                <span key={l.name} className="flex items-center gap-1.5 text-xs text-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                  {l.name} <span className="text-muted-foreground font-normal">({l.percentage}%)</span>
                </span>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" /> Detected Frameworks & Stack
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {technology.frameworks.map((f) => (
                    <span key={f} className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                  <FileCode2 className="h-3.5 w-3.5" /> Primary Directory Trees
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {technology.largestDirectories.map((d) => (
                    <code key={d} className="px-2 py-0.5 rounded bg-muted/60 text-[11px] font-mono text-foreground">
                      {d}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Code Quality Insight:</strong> {technology.codeQualityInsight}
            </p>
          </div>
        </Card>

        {/* 8. Repository Activity Timeline Track */}
        <Card className="p-6" lift={false}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand" /> Repository Milestone Timeline
              </h3>
              <p className="text-xs text-muted-foreground">Recent commits, PR merges, and releases</p>
            </div>
            <Badge tone="brand">Chronological</Badge>
          </div>

          <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
            {timeline.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">No recent milestone events recorded.</div>
            ) : (
              timeline.map((event) => (
                <div key={event.id} className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5 h-6 w-6 rounded-full bg-brand/10 text-brand grid place-items-center shrink-0 ring-1 ring-border">
                    {event.type === "release" ? (
                      <Sparkles className="h-3 w-3 text-amber-400" />
                    ) : event.type === "pr_merge" ? (
                      <GitPullRequest className="h-3 w-3 text-purple-400" />
                    ) : (
                      <GitCommit className="h-3 w-3 text-brand" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground truncate">{event.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{formatRelativeTime(event.date)}</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] truncate mt-0.5">{event.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
