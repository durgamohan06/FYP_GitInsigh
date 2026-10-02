import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge, Card } from "@/components/ui-bits";
import {
  teamAnalyticsService,
  type ContributorProject,
  type DeveloperDetails,
  type MemberProjectSummary,
  type ProjectStatus,
} from "@/lib/team-analytics-service";
import {
  Archive,
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  FolderGit2,
  GitCommitHorizontal,
  GitMerge,
  GitPullRequest,
  Loader2,
  MessageSquare,
  Minus,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/team/developers/$id")({
  head: () => ({ meta: [{ title: "Developer Analytics · GitInsight AI" }] }),
  component: DeveloperDetailsPage,
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}

function totalActivity(p: ContributorProject): number {
  const a = p.activity;
  return a.totalCommits + a.pullRequests + a.issuesOpened + (a.reviews ?? 0);
}

type ProjectFilter = "all" | ProjectStatus;
type ProjectSort = "recent" | "contributions" | "name";

// ── Status badge ─────────────────────────────────────────────────────────────

const statusConfig: Record<
  ProjectStatus,
  { tone: "success" | "warning" | "default" | "brand"; label: string }
> = {
  Active: { tone: "success", label: "Active" },
  Inactive: { tone: "warning", label: "Inactive" },
  "Past / Inactive": { tone: "default", label: "Past / Inactive" },
  Archived: { tone: "default", label: "Archived" },
};

function StatusBadge({ status }: { status: ProjectStatus }) {
  const cfg = statusConfig[status];
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

// ── Single project card ───────────────────────────────────────────────────────

function ProjectCard({ project }: { project: ContributorProject }) {
  const { activity } = project;
  const hasMeaningfulData =
    activity.totalCommits > 0 ||
    activity.pullRequests > 0 ||
    activity.issuesOpened > 0 ||
    (activity.reviews ?? 0) > 0;

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <FolderGit2 className="h-4 w-4 shrink-0 text-brand" />
          <div className="min-w-0">
            <div className="font-semibold truncate">{project.repositoryName}</div>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-brand inline-flex items-center gap-1 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {project.fullName}
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {activity.archived && <Archive className="h-3.5 w-3.5 text-muted-foreground" />}
          <StatusBadge status={project.status} />
        </div>
      </div>

      {/* Activity metrics */}
      {hasMeaningfulData ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 mb-3">
          {activity.totalCommits > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <GitCommitHorizontal className="h-3.5 w-3.5 text-brand shrink-0" />
              <span>
                <strong>{activity.totalCommits}</strong> commits
              </span>
            </div>
          )}
          {activity.pullRequests > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <GitPullRequest className="h-3.5 w-3.5 text-accent-cyan shrink-0" />
              <span>
                <strong>{activity.pullRequests}</strong> PRs
              </span>
            </div>
          )}
          {activity.mergedPullRequests > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <GitMerge className="h-3.5 w-3.5 text-success shrink-0" />
              <span>
                <strong>{activity.mergedPullRequests}</strong> merged
              </span>
            </div>
          )}
          {activity.issuesOpened > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <Minus className="h-3.5 w-3.5 text-warning shrink-0" />
              <span>
                <strong>{activity.issuesOpened}</strong> issues
                {activity.issuesClosed > 0 && (
                  <span className="text-muted-foreground"> ({activity.issuesClosed} closed)</span>
                )}
              </span>
            </div>
          )}
          {(activity.reviews ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5 text-brand-2 shrink-0" />
              <span>
                <strong>{activity.reviews}</strong> reviews
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-3 italic">
          No measurable result data available
        </p>
      )}

      {/* Footer: latest contribution + repo last pushed */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground border-t border-border pt-2.5">
        <span>
          Latest contribution:{" "}
          <strong className="text-foreground">{relativeTime(activity.latestContribution)}</strong>
        </span>
        {activity.repositoryLastPushed && (
          <span>Repo pushed: {relativeTime(activity.repositoryLastPushed)}</span>
        )}
      </div>
    </Card>
  );
}

// ── Projects section ──────────────────────────────────────────────────────────

function ProjectsSection({
  login,
  summary,
}: {
  login: string;
  summary: MemberProjectSummary | null;
}) {
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [sort, setSort] = useState<ProjectSort>("recent");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [memberSummary, setMemberSummary] = useState<MemberProjectSummary | null>(summary);

  useEffect(() => {
    if (summary) {
      setMemberSummary(summary);
      setLoadingProjects(false);
      return;
    }
    setLoadingProjects(true);
    teamAnalyticsService
      .getProjects([login])
      .then((res) => setMemberSummary(res.projects[login] ?? null))
      .catch(() => setMemberSummary(null))
      .finally(() => setLoadingProjects(false));
  }, [login, summary]);

  if (loadingProjects) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-brand mb-2" />
        <p className="text-sm text-muted-foreground">Loading project history…</p>
      </Card>
    );
  }

  if (!memberSummary || memberSummary.projectsWorkedOn === 0) {
    return (
      <Card className="p-8 text-center">
        <FolderGit2 className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <div className="font-semibold">No project history found</div>
        <p className="mt-1 text-sm text-muted-foreground">
          No repositories were found where @{login} has meaningful GitHub activity.
        </p>
      </Card>
    );
  }

  // Filter
  const filters: { value: ProjectFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: memberSummary.projectsWorkedOn },
    { value: "Active", label: "Active", count: memberSummary.active },
    {
      value: "Inactive",
      label: "Inactive",
      count: memberSummary.inactive,
    },
    { value: "Archived", label: "Archived", count: memberSummary.archived },
  ];

  let visible = memberSummary.projects;
  if (filter !== "all") {
    visible = visible.filter((p) =>
      filter === "Inactive"
        ? p.status === "Inactive" || p.status === "Past / Inactive"
        : p.status === filter,
    );
  }

  // Sort
  if (sort === "recent") {
    visible = [...visible].sort((a, b) => {
      const ta = a.activity.latestContribution
        ? new Date(a.activity.latestContribution).getTime()
        : 0;
      const tb = b.activity.latestContribution
        ? new Date(b.activity.latestContribution).getTime()
        : 0;
      return tb - ta;
    });
  } else if (sort === "contributions") {
    visible = [...visible].sort((a, b) => totalActivity(b) - totalActivity(a));
  } else {
    visible = [...visible].sort((a, b) => a.repositoryName.localeCompare(b.repositoryName));
  }

  return (
    <div>
      {/* Summary chips + sort */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Filter tabs */}
        <div className="flex rounded-lg border border-border bg-card overflow-hidden">
          {filters.map(({ value, label, count }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === value
                  ? "bg-brand text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
              aria-pressed={filter === value}
              id={`project-filter-${value}`}
            >
              {label}
              {count > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                    filter === value ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs"
            value={sort}
            onChange={(e) => setSort(e.target.value as ProjectSort)}
            aria-label="Sort projects"
            id="project-sort-select"
          >
            <option value="recent">Most recently active</option>
            <option value="contributions">Most contributions</option>
            <option value="name">Project name</option>
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          No {filter !== "all" ? filter.toLowerCase() : ""} projects found.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((project) => (
            <ProjectCard key={project.repositoryId} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function DeveloperDetailsPage() {
  const { id } = Route.useParams();
  const [developer, setDeveloper] = useState<DeveloperDetails | null>(null);
  const [repository, setRepository] = useState<string>("");

  useEffect(() => {
    const repo = new URLSearchParams(window.location.search).get("repository") ?? "";
    setRepository(repo);
    if (repo) {
      teamAnalyticsService
        .getDeveloperDetails(id, repo)
        .then(setDeveloper)
        .catch(() => setDeveloper(null));
    }
  }, [id]);

  if (!developer) {
    return (
      <AppShell>
        <div className="grid place-items-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-brand" />
        </div>
      </AppShell>
    );
  }

  const summary = [
    ["Commits", developer.commits],
    ["Pull Requests", developer.pullRequests],
    ["Merged PRs", developer.mergedPullRequests],
    ["Issues", developer.issues],
    ["Reviews", developer.reviews],
    ["Code Changes", developer.codeChanges.toLocaleString()],
  ] as const;

  return (
    <AppShell>
      <Link
        to="/team"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Team Analytics
      </Link>

      <PageHeader title={developer.name} subtitle={`@${developer.username} · ${developer.role}`} />

      {/* Avatar + score */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-16 w-16 rounded-full bg-brand-gradient text-white grid place-items-center text-xl font-semibold shrink-0">
          {developer.avatar}
        </div>
        <div>
          <div className="text-3xl font-semibold">
            {developer.score}
            <span className="text-sm text-muted-foreground"> / 100 performance score</span>
          </div>
          <Badge tone="brand">{developer.grade}</Badge>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 mb-6">
        {summary.map(([label, value]) => (
          <Card key={label} className="p-4">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-2 text-xl font-semibold">{value}</div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2 mb-8">
        <Card className="p-6">
          <div className="font-semibold mb-4">Contribution activity</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={developer.activity}>
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="commits" fill="var(--color-brand)" />
                <Bar dataKey="pullRequests" fill="var(--color-brand-2)" />
                <Bar dataKey="reviews" fill="var(--color-accent-cyan)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="font-semibold mb-4">Performance factors</div>
          {developer.scoreFactors.map((factor) => (
            <div key={factor.label} className="mb-4">
              <div className="flex justify-between text-sm">
                <span>{factor.label}</span>
                <span>
                  {factor.value}/{factor.weight}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand-gradient"
                  style={{
                    width: `${Math.min(100, (factor.value / factor.weight) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
          <p className="mt-5 text-xs text-muted-foreground">{developer.insight}</p>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="font-semibold mb-4">Code, reviews, and issue activity</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["Additions", developer.additions],
                ["Deletions", developer.deletions],
                ["Files changed", developer.filesChanged],
                ["PR merge time", `${developer.mergeTimeHours}h`],
                ["Review response", `${developer.responseTimeHours}h`],
                ["Open issues", developer.openIssues],
                ["Closed issues", developer.closedIssues],
                ["PR comments", developer.prComments],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-muted/60 p-4">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-2 font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Project History section ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FolderGit2 className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-semibold">Project History</h2>
          <span className="text-xs text-muted-foreground">
            Repositories with meaningful activity by @{developer.username}
          </span>
        </div>
        <ProjectsSection login={developer.username} summary={null} />
      </div>

      {/* Repository context note */}
      {repository && (
        <p className="text-xs text-muted-foreground">
          Analytics above are scoped to{" "}
          <code className="rounded bg-muted px-1 py-0.5">{repository}</code>. Project history covers
          all accessible repositories.
        </p>
      )}
    </AppShell>
  );
}
