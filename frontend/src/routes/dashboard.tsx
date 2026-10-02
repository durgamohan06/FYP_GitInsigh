import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, Badge, CountUp, Sparkline, CircularProgress, Button } from "@/components/ui-bits";
import * as Icons from "lucide-react";
import {
  ResponsiveContainer,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { GitHubUserProfile } from "@/lib/github-oauth";
import type { DashboardDataResponse } from "@/lib/dashboard-api";
import { RefreshCw, AlertCircle, GitBranch, Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · GitInsight AI" },
      {
        name: "description",
        content:
          "Real-time project health, commits, PRs, and AI blockers across your GitHub repositories.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [userName, setUserName] = useState("Durga");
  const [data, setData] = useState<DashboardDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const url = forceRefresh
        ? `/api/dashboard?refresh=true&_t=${Date.now()}`
        : `/api/dashboard?_t=${Date.now()}`;
      const res = await fetch(url, { headers, credentials: "include" });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.message || json.error || `Failed to fetch dashboard data (${res.status})`,
        );
      }

      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to connect to GitHub dashboard API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/user", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        if (user?.name || user?.login) {
          setUserName(user.name || user.login);
        }
      })
      .catch(() => {});

    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("github_user");
      if (cached) {
        try {
          const user: GitHubUserProfile = JSON.parse(cached);
          if (user.name || user.login) {
            setUserName(user.name || user.login);
          }
        } catch {}
      }
    }

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const refresh = () => fetchDashboardData(true);
    window.addEventListener("gitinsight-auto-refresh", refresh);
    return () => window.removeEventListener("gitinsight-auto-refresh", refresh);
  }, []);

  const progressColors = [
    "var(--color-brand)",
    "var(--color-brand-2)",
    "var(--color-accent-cyan)",
    "var(--color-warning)",
    "var(--color-success)",
    "var(--color-danger)",
  ];

  return (
    <AppShell>
      <PageHeader
        title={`Good Morning, ${userName} 👋`}
        subtitle="Here's what's happening across your GitHub projects today."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => fetchDashboardData(true)} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Sync now
            </Button>
            <Link to="/repositories">
              <Button>
                <Plus className="h-4 w-4" /> View Repositories
              </Button>
            </Link>
          </div>
        }
      />

      {/* Error state banner */}
      {error && !loading && (
        <Card className="p-6 mb-6 border-danger/40 bg-danger/5 text-center" lift={false}>
          <div className="h-11 w-11 rounded-2xl bg-danger/10 text-danger mx-auto grid place-items-center mb-3">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Failed to Load Live GitHub Data
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">{error}</p>
          <Button onClick={() => fetchDashboardData()}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </Card>
      )}

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card
              className="p-6 lg:col-span-1 h-64 animate-pulse flex flex-col items-center justify-center"
              lift={false}
            >
              <div className="h-32 w-32 rounded-full bg-muted" />
              <div className="h-4 w-24 bg-muted rounded mt-4" />
            </Card>
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-5 animate-pulse" lift={false}>
                  <div className="h-8 w-8 bg-muted rounded-lg mb-3" />
                  <div className="h-6 w-16 bg-muted rounded mb-2" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </Card>
              ))}
            </div>
          </div>
          <Card className="p-6 h-64 animate-pulse" lift={false}>
            <div className="h-4 w-36 bg-muted rounded mb-4" />
            <div className="h-44 w-full bg-muted/50 rounded" />
          </Card>
        </div>
      )}

      {/* Live Data Render */}
      {data && (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Health Score Gauge */}
            <Card className="p-6 lg:col-span-1 flex flex-col items-center justify-center">
              <div className="text-sm text-muted-foreground mb-2">Project Health Score</div>
              <CircularProgress
                value={data.healthScore}
                label={
                  data.healthScore >= 80
                    ? "Healthy Project"
                    : data.healthScore >= 60
                      ? "Moderate Risks"
                      : "Critical Attention"
                }
                sublabel={`Across ${data.totalRepos} repositories`}
              />
              <div className="mt-4 flex gap-2">
                <Badge
                  tone={
                    data.healthScore >= 80
                      ? "success"
                      : data.healthScore >= 60
                        ? "warning"
                        : "danger"
                  }
                >
                  {data.healthScore >= 80
                    ? "↑ Optimal"
                    : data.healthScore >= 60
                      ? "→ Needs Review"
                      : "↓ Critical"}
                </Badge>
                <Badge tone="brand">AI verified</Badge>
              </div>
            </Card>

            {/* Top 6 Metric Cards */}
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
              {data.stats.map((s) => {
                const Icon = (Icons as any)[s.icon] ?? Icons.Activity;
                const up = s.trend >= 0;
                return (
                  <Card key={s.label} className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="h-9 w-9 rounded-xl bg-brand/10 grid place-items-center text-brand">
                        <Icon className="h-4 w-4" />
                      </div>
                      <Badge tone={up ? "success" : "danger"}>
                        {up ? "↑" : "↓"} {Math.abs(s.trend)}%
                      </Badge>
                    </div>
                    <div className="mt-4 text-2xl font-semibold tracking-tight">
                      <CountUp value={s.value} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                    <div className="mt-2 -mx-1">
                      <Sparkline data={s.spark} />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Module Progress & AI Blockers */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-semibold">Project Progress</div>
                  <div className="text-xs text-muted-foreground">
                    Completion & activity by repository
                  </div>
                </div>
                <Badge tone="brand">Live</Badge>
              </div>
              <div className="space-y-4">
                {data.repositories.slice(0, 6).map((r, i) => (
                  <div key={r.id}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium truncate max-w-[200px]">{r.name}</span>
                      <span className="text-muted-foreground text-xs">{r.progress}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${r.progress}%`,
                          background: `linear-gradient(90deg, ${progressColors[i % progressColors.length]}, color-mix(in oklab, ${progressColors[i % progressColors.length]} 60%, white))`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="font-semibold mb-1">AI Blockers</div>
              <div className="text-xs text-muted-foreground mb-4">
                Detected in your repositories
              </div>
              <div className="space-y-3">
                {data.blockers.map((b, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-border p-3 hover:bg-accent/50 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium leading-snug">{b.title}</div>
                      <Badge
                        tone={
                          b.priority === "Critical"
                            ? "danger"
                            : b.priority === "High"
                              ? "warning"
                              : "brand"
                        }
                      >
                        {b.priority}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{b.impact}</div>
                    <div className="text-[11px] text-brand/90 mt-1.5 font-medium">{b.fix}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 30-Day Activity Chart & Heatmap */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-semibold">Commit & PR Activity</div>
                  <div className="text-xs text-muted-foreground">
                    Last 30 days across your repositories
                  </div>
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-brand" />
                    Commits
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-brand-2" />
                    PRs
                  </span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.activity} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-brand-2)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--color-brand-2)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="var(--color-border)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="commits"
                      stroke="var(--color-brand)"
                      strokeWidth={2.2}
                      fill="url(#g1)"
                    />
                    <Area
                      type="monotone"
                      dataKey="prs"
                      stroke="var(--color-brand-2)"
                      strokeWidth={2.2}
                      fill="url(#g2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <div className="font-semibold mb-1">Contribution Heatmap</div>
              <div className="text-xs text-muted-foreground mb-4">Last 26 weeks</div>
              <div className="flex gap-1 overflow-x-auto pb-2">
                {data.heatmap[0].map((_, col) => (
                  <div key={col} className="flex flex-col gap-1">
                    {data.heatmap.map((row, rowIdx) => {
                      const v = row[col];
                      const bg = [
                        "bg-muted",
                        "bg-brand/25",
                        "bg-brand/45",
                        "bg-brand/70",
                        "bg-brand",
                      ][v];
                      return <div key={rowIdx} className={`h-3 w-3 rounded-sm ${bg}`} />;
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="h-3 w-3 rounded-sm bg-muted" />
                  <div className="h-3 w-3 rounded-sm bg-brand/25" />
                  <div className="h-3 w-3 rounded-sm bg-brand/45" />
                  <div className="h-3 w-3 rounded-sm bg-brand/70" />
                  <div className="h-3 w-3 rounded-sm bg-brand" />
                </div>
                <span>More</span>
              </div>
            </Card>
          </div>

          {/* Monitored Repositories Table */}
          <Card className="mt-6 p-0 overflow-hidden">
            <div className="p-6 flex items-center justify-between">
              <div>
                <div className="font-semibold">Repositories</div>
                <div className="text-xs text-muted-foreground">
                  All monitored GitHub repositories
                </div>
              </div>
              <Link to="/repositories" className="text-sm text-brand font-medium hover:underline">
                View all →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    {[
                      "Repository",
                      "Branch",
                      "Commits (30d)",
                      "PRs",
                      "Issues",
                      "Updated",
                      "Status",
                      "",
                    ].map((h) => (
                      <th key={h} className="text-left font-medium px-6 py-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.repositories.map((r) => (
                    <tr key={r.id} className="border-t border-border hover:bg-accent/40 transition">
                      <td className="px-6 py-3 font-medium">
                        {r.owner}/{r.name}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{r.branch}</td>
                      <td className="px-6 py-3">{r.commits}</td>
                      <td className="px-6 py-3">{r.prs}</td>
                      <td className="px-6 py-3">{r.issues}</td>
                      <td className="px-6 py-3 text-muted-foreground">{r.updated}</td>
                      <td className="px-6 py-3">
                        <Badge
                          tone={
                            r.status === "Healthy"
                              ? "success"
                              : r.status === "Delayed"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3">
                        <Link
                          to="/repositories/$id"
                          params={{ id: r.id }}
                          className="text-brand font-medium hover:underline"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </AppShell>
  );
}
