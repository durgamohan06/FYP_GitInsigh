import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge, Button, Card } from "@/components/ui-bits";
import {
  teamAnalyticsService,
  type ContributionMetric,
  type DateRange,
  type DeveloperMetric,
  type MemberProjectSummary,
  type RepositoryOption,
  type TeamAnalyticsData,
} from "@/lib/team-analytics-service";
import {
  AlertCircle,
  Archive,
  ChevronDown,
  Clock,
  FolderGit2,
  Loader2,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/team")({
  head: () => ({ meta: [{ title: "Team Analytics · GitInsight AI" }] }),
  component: Team,
});

const metrics: Record<ContributionMetric, string> = {
  commits: "Commits",
  pullRequests: "Pull Requests",
  issues: "Issues",
  reviews: "Reviews",
  codeChanges: "Code Changes",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  return `${Math.round(days / 365)} years ago`;
}

type SearchResult =
  { kind: "repo"; repo: RepositoryOption } | { kind: "contributor"; developer: DeveloperMetric };

/**
 * Rank matches: exact > starts-with > partial (case-insensitive).
 * Returns a numeric score — higher = better match.
 */
function matchScore(haystack: string, needle: string): number {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (h === n) return 3;
  if (h.startsWith(n)) return 2;
  if (h.includes(n)) return 1;
  return 0;
}

function searchRepos(repos: RepositoryOption[], query: string): RepositoryOption[] {
  const q = query.toLowerCase().trim();
  if (!q) return repos;
  return repos
    .map((r) => ({
      r,
      score: Math.max(matchScore(r.name, q), matchScore(r.fullName, q), matchScore(r.owner, q)),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ r }) => r);
}

function searchContributors(developers: DeveloperMetric[], query: string): DeveloperMetric[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return developers
    .map((d) => ({
      d,
      score: Math.max(matchScore(d.username, q), matchScore(d.name, q)),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ d }) => d);
}

// ── Combined intelligent search / selector ───────────────────────────────────

function RepoSearchSelector({
  repos,
  developers,
  selectedRepo,
  onSelectRepo,
  onSelectContributor,
}: {
  repos: RepositoryOption[];
  developers: DeveloperMetric[];
  selectedRepo: string;
  onSelectRepo: (fullName: string) => void;
  onSelectContributor: (login: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const isSearching = query.trim().length > 0;
  const matchedRepos = isSearching ? searchRepos(repos, query) : repos;
  const matchedContributors = isSearching ? searchContributors(developers, query) : [];
  const hasRepoResults = matchedRepos.length > 0;
  const hasContributorResults = matchedContributors.length > 0;
  const hasAnyResults = hasRepoResults || hasContributorResults;

  const selected = repos.find((r) => r.fullName === selectedRepo);

  function pick(result: SearchResult) {
    if (result.kind === "repo") {
      onSelectRepo(result.repo.fullName);
    } else {
      onSelectContributor(result.developer.username);
    }
    setOpen(false);
    setQuery("");
  }

  function openDropdown() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div ref={containerRef} className="relative w-80" id="repo-search-selector">
      {/* Trigger / display */}
      <div
        className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm hover:border-brand/40 transition-colors"
        onClick={
          open
            ? () => {
                setOpen(false);
                setQuery("");
              }
            : openDropdown
        }
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Search repositories and contributors"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openDropdown();
        }}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        {open ? (
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            placeholder="Search repos or contributors…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            aria-label="Search query"
          />
        ) : (
          <span className="flex-1 truncate text-sm">
            {selected ? (
              <span className="flex items-center gap-1.5">
                <FolderGit2 className="h-3.5 w-3.5 text-brand shrink-0" />
                <span className="truncate">{selected.name}</span>
                <span className="text-muted-foreground text-xs shrink-0">{selected.owner}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Search repositories…</span>
            )}
          </span>
        )}
        {open && query ? (
          <X
            className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setQuery("");
            }}
          />
        ) : (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </div>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute left-0 right-0 top-11 z-50 max-h-96 overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
          role="listbox"
          aria-label="Repository and contributor results"
        >
          {/* ── Repositories section ── */}
          {isSearching && !hasAnyResults ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No matching repositories or contributors
            </div>
          ) : (
            <>
              {/* Repos */}
              {hasRepoResults && (
                <div>
                  {isSearching && (
                    <div className="sticky top-0 bg-card/95 backdrop-blur-sm px-3 pt-2 pb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Repositories
                      </span>
                    </div>
                  )}
                  {!isSearching && (
                    <div className="px-3 pt-2 pb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        All Repositories
                      </span>
                    </div>
                  )}
                  {matchedRepos.map((repo) => (
                    <button
                      key={repo.id}
                      type="button"
                      role="option"
                      aria-selected={repo.fullName === selectedRepo}
                      className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent ${repo.fullName === selectedRepo ? "bg-brand/8 border-l-2 border-brand" : ""}`}
                      onClick={() => pick({ kind: "repo", repo })}
                    >
                      <FolderGit2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{repo.name}</span>
                          {repo.archived && (
                            <Archive className="h-3 w-3 shrink-0 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">{repo.fullName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>Updated {relativeTime(repo.pushedAt ?? repo.updatedAt)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Contributors (only when searching) */}
              {isSearching && hasContributorResults && (
                <div className={hasRepoResults ? "border-t border-border" : ""}>
                  <div className="sticky top-0 bg-card/95 backdrop-blur-sm px-3 pt-2 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Contributors
                    </span>
                  </div>
                  {matchedContributors.map((dev) => (
                    <button
                      key={dev.id}
                      type="button"
                      role="option"
                      aria-selected={false}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent"
                      onClick={() => pick({ kind: "contributor", developer: dev })}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-[11px] font-semibold text-white">
                        {dev.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{dev.username}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dev.commits} commits · score {dev.score}/100
                        </div>
                      </div>
                      <Badge tone="brand">{dev.grade}</Badge>
                    </button>
                  ))}
                </div>
              )}

              {/* Empty states for search */}
              {isSearching && !hasRepoResults && hasContributorResults && (
                <div className="px-3 pb-2 text-xs text-muted-foreground">No repositories found</div>
              )}
              {isSearching && hasRepoResults && !hasContributorResults && (
                <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                  No contributors found
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Contributor card ──────────────────────────────────────────────────────────

function ContributorCard({
  developer,
  repository,
  projectSummary,
}: {
  developer: DeveloperMetric;
  repository: string;
  projectSummary?: MemberProjectSummary;
}) {
  const href = `/team/developers/${encodeURIComponent(developer.id)}?repository=${encodeURIComponent(repository)}`;

  return (
    <a href={href} id={`contributor-card-${developer.id}`}>
      <Card className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-brand-gradient text-white grid place-items-center font-semibold text-lg shrink-0">
            {developer.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{developer.name}</div>
            <div className="text-xs text-muted-foreground truncate">@{developer.username}</div>
          </div>
          <Badge tone="brand">{developer.grade}</Badge>
        </div>

        {/* Score */}
        <div className="text-3xl font-semibold">
          {developer.score}
          <span className="text-xs text-muted-foreground"> / 100</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {(
            [
              ["Commits", developer.commits],
              ["Issues", developer.issues],
              ["PRs", developer.pullRequests],
              ["Reviews", developer.reviews],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-lg bg-muted/60 py-2">
              <div className="text-sm font-semibold">{value}</div>
              <div className="text-[10px] text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {/* Project summary strip */}
        {projectSummary && projectSummary.projectsWorkedOn > 0 && (
          <div className="border-t border-border pt-3 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FolderGit2 className="h-3.5 w-3.5" />
              <span>
                <strong className="text-foreground">{projectSummary.projectsWorkedOn}</strong>{" "}
                {projectSummary.projectsWorkedOn === 1 ? "project" : "projects"}
              </span>
            </span>
            {projectSummary.active > 0 && (
              <span className="flex items-center gap-1 text-success">
                ● {projectSummary.active} active
              </span>
            )}
            {projectSummary.inactive > 0 && (
              <span className="flex items-center gap-1 text-warning">
                ● {projectSummary.inactive} inactive
              </span>
            )}
            {projectSummary.archived > 0 && (
              <span className="flex items-center gap-1">
                <Archive className="h-3 w-3" /> {projectSummary.archived} archived
              </span>
            )}
          </div>
        )}
        {projectSummary && projectSummary.projectsWorkedOn === 0 && (
          <div className="border-t border-border pt-3 text-xs text-muted-foreground">
            No project history found
          </div>
        )}
      </Card>
    </a>
  );
}

// ── Loading state ─────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="grid place-items-center py-24">
      <Loader2 className="h-7 w-7 animate-spin text-brand" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function Team() {
  const navigate = useNavigate();
  const [repos, setRepos] = useState<RepositoryOption[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [range, setRange] = useState<DateRange>("30d");
  const [developer, setDeveloper] = useState("all");
  const [metric, setMetric] = useState<ContributionMetric>("commits");
  const [data, setData] = useState<TeamAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectSummaries, setProjectSummaries] = useState<Record<string, MemberProjectSummary>>(
    {},
  );

  // Load repos on mount — auto-select most recently pushed (sorted by pushedAt desc)

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    teamAnalyticsService
      .getRepositories()
      .then((result) => {
        if (cancelled) return;
        setRepos(result);
        if (result[0]) setSelectedRepo((prev) => prev || result[0].fullName);
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "Unable to load GitHub repositories."),
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Reload analytics when selected repo or date range changes
  useEffect(() => {
    if (!selectedRepo) return;
    let cancelled = false;
    setLoading(true);
    teamAnalyticsService
      .getAnalytics({ repository: selectedRepo, dateRange: range })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((reason) => {
        if (!cancelled)
          setError(reason instanceof Error ? reason.message : "Unable to load GitHub analytics.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRepo, range]);

  // Load project summaries when contributor list changes
  useEffect(() => {
    if (!data?.developers.length) return;
    teamAnalyticsService
      .getProjects(data.developers.map((d) => d.username))
      .then((result) => setProjectSummaries(result.projects))
      .catch(() => setProjectSummaries({}));
  }, [data]);

  const contributors =
    data?.developers.filter((d) => developer === "all" || d.id === developer) ?? [];
  const total = (key: "commits" | "pullRequests" | "issues" | "reviews") =>
    contributors.reduce((sum, d) => sum + d[key], 0);
  const chartData = contributors.map((d) => ({ developer: d.username, value: d[metric] }));

  function handleSelectContributor(login: string) {
    void navigate({
      to: "/team/developers/$id",
      params: { id: login },
      search: { repository: selectedRepo } as Record<string, string>,
    });
  }

  return (
    <AppShell>
      <PageHeader
        title="Team Analytics"
        subtitle="GitHub contributors, activity, and repository performance."
      />

      {/* ── Controls bar ── */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <RepoSearchSelector
          repos={repos}
          developers={data?.developers ?? []}
          selectedRepo={selectedRepo}
          onSelectRepo={(fullName) => {
            setSelectedRepo(fullName);
            setDeveloper("all");
          }}
          onSelectContributor={handleSelectContributor}
        />

        <select
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
          value={range}
          onChange={(e) => setRange(e.target.value as DateRange)}
          aria-label="Date range"
          id="date-range-select"
        >
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="year">This year</option>
        </select>

        <select
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
          value={developer}
          onChange={(e) => setDeveloper(e.target.value)}
          aria-label="Filter by contributor"
          id="contributor-filter-select"
        >
          <option value="all">All contributors</option>
          {data?.developers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.username}
            </option>
          ))}
        </select>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-danger" />
          <p className="mt-3">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </Card>
      ) : !contributors.length ? (
        <Card className="p-10 text-center">
          <div className="font-semibold">No contributors found</div>
          <p className="mt-2 text-sm text-muted-foreground">
            {selectedRepo
              ? `No contributors were found in ${selectedRepo}.`
              : "Select a repository to view contributors."}
          </p>
        </Card>
      ) : (
        <>
          {/* Overview stats */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 mb-6">
            {(
              [
                ["Contributors", contributors.length],
                ["Commits", total("commits")],
                ["Pull Requests", total("pullRequests")],
                ["Issues", total("issues")],
                ["Reviews", total("reviews")],
                [
                  "Average Score",
                  Math.round(
                    contributors.reduce((sum, d) => sum + d.score, 0) / contributors.length,
                  ),
                ],
              ] as const
            ).map(([label, value]) => (
              <Card key={label} className="p-4">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-2 text-2xl font-semibold">{value}</div>
              </Card>
            ))}
          </div>

          {/* Contributor cards */}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 mb-6">
            {contributors.map((d) => (
              <ContributorCard
                key={d.id}
                developer={d}
                repository={data?.repository.fullName ?? selectedRepo}
                projectSummary={projectSummaries[d.username]}
              />
            ))}
          </div>

          {/* Contribution comparison chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Contribution comparison</div>
              <select
                className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
                value={metric}
                onChange={(e) => setMetric(e.target.value as ContributionMetric)}
                aria-label="Comparison metric"
                id="metric-select"
              >
                {Object.entries(metrics).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis dataKey="developer" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="var(--color-brand)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </AppShell>
  );
}
