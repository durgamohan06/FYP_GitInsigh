import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  GitBranch,
  Sparkles,
  Mic,
  Users,
  FileText,
  Settings,
  LogOut,
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import type { GitHubUserProfile } from "@/lib/github-oauth";
import { applyTheme, loadSettings, saveTheme, type AppSettings } from "@/lib/settings-service";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/repositories", label: "Repositories", icon: GitBranch },
  { to: "/ai-insights", label: "AI Insights", icon: Sparkles },
  { to: "/voice", label: "Voice Assistant", icon: Mic },
  { to: "/team", label: "Team Analytics", icon: Users },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

type SearchResult = { id: string | number; title: string; description?: string | null; url: string; avatarUrl?: string; type: string };

function SearchGroup({ label, results }: { label: string; results: SearchResult[] }) {
  if (!results.length) return null;
  return <div className="mb-2 last:mb-0"><div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>{results.map((result) => <a key={`${result.type}-${result.id}`} href={result.url} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent"><div className="h-7 w-7 shrink-0 rounded-md bg-brand/10 text-brand grid place-items-center text-xs font-semibold">{result.avatarUrl ? <img src={result.avatarUrl} alt="" className="h-7 w-7 rounded-md" /> : result.title.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><div className="truncate text-sm font-medium">{result.title}</div><div className="truncate text-xs text-muted-foreground">{result.description}</div></div></a>)}</div>;
}

function useTheme() {
  const [theme, setTheme] = useState<AppSettings["theme"]>(() => loadSettings().theme);
  const [dark, setDark] = useState(() => {
    const currentTheme = loadSettings().theme;
    return currentTheme === "dark" || (currentTheme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useLayoutEffect(() => {
    const currentTheme = loadSettings().theme;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = (nextTheme: AppSettings["theme"]) => {
      setTheme(nextTheme);
      const nextDark = nextTheme === "dark" || (nextTheme === "system" && media.matches);
      setDark(nextDark);
      applyTheme(nextTheme);
    };

    const handleSystemChange = () => {
      if (theme === "system") sync("system");
    };

    sync(currentTheme);
    media.addEventListener("change", handleSystemChange);

    return () => media.removeEventListener("change", handleSystemChange);
  }, [theme]);

  const toggle = () => {
    const nextTheme = dark ? "light" : "dark";
    saveTheme(nextTheme);
    setTheme(nextTheme);
    setDark(nextTheme === "dark");
    applyTheme(nextTheme);
  };

  return { dark, toggle };
}

export function AppShell({ children, dashboard = false }: { children: ReactNode; dashboard?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gitinsight_sidebar_collapsed") === "true";
    }
    return false;
  });
  const { dark, toggle } = useTheme();
  const [user, setUser] = useState<GitHubUserProfile | null>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ repositories: SearchResult[]; issues: SearchResult[]; users: SearchResult[] }>({ repositories: [], issues: [], users: [] });
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [platformRepositories, setPlatformRepositories] = useState<SearchResult[]>([]);
  const [notifications, setNotifications] = useState(0);
  const [refreshSettingsVersion, setRefreshSettingsVersion] = useState(0);

  const toggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        if (typeof window !== "undefined") {
          localStorage.setItem("gitinsight_sidebar_collapsed", String(next));
        }
        return next;
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!dashboard) return;

    const landingStylesheet = Array.from(document.querySelectorAll("style")).find((style) =>
      style.textContent?.includes("SF Pro Display"),
    );
    if (!landingStylesheet?.parentNode) return;

    const parent = landingStylesheet.parentNode;
    const nextSibling = landingStylesheet.nextSibling;
    parent.removeChild(landingStylesheet);

    return () => {
      if (!landingStylesheet.isConnected) {
        parent.insertBefore(landingStylesheet, nextSibling);
      }
    };
  }, [dashboard]);

  useEffect(() => {
    const settings = loadSettings();
    if (!settings.autoRefresh.enabled) return;
    const timer = window.setInterval(() => window.dispatchEvent(new CustomEvent("gitinsight-auto-refresh")), settings.autoRefresh.intervalMinutes * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [refreshSettingsVersion]);

  useEffect(() => {
    const restart = () => setRefreshSettingsVersion((version) => version + 1);
    window.addEventListener("gitinsight-settings-saved", restart);
    return () => window.removeEventListener("gitinsight-settings-saved", restart);
  }, []);

  useEffect(() => {
    const query = search.trim().toLowerCase();
    if (query.length < 1) { setSearchResults({ repositories: [], issues: [], users: [] }); setSearchError(""); setSearching(false); return; }
    setSearching(true);
    const features: SearchResult[] = nav.filter((item) => `${item.label} ${item.to}`.toLowerCase().includes(query)).map((item) => ({ id: item.to, title: item.label, description: `Open ${item.label}`, url: item.to, type: "GitInsight feature" }));
    const repositories = platformRepositories.filter((item) => `${item.title} ${item.description ?? ""}`.toLowerCase().includes(query));
    setSearchResults({ repositories, issues: features, users: [] });
    setSearchError("");
    setSearching(false);
  }, [search, platformRepositories]);

  useEffect(() => {
    fetch("/api/repos", { credentials: "include" }).then((response) => response.ok ? response.json() : null).then((data) => {
      const repositories = data?.data ?? [];
      setPlatformRepositories(repositories.map((repository: { id: number; name: string; full_name: string; description?: string | null }) => ({ id: repository.id, title: repository.full_name, description: repository.description ?? "Repository", url: `/repositories/${encodeURIComponent(repository.name)}`, type: "Repository" })));
    }).catch(() => setPlatformRepositories([]));
  }, []);

  useEffect(() => {
    const handleRepositorySearch = (event: Event) => {
      const query = (event as CustomEvent<string>).detail;
      if (typeof query === "string") setSearch(query);
    };
    window.addEventListener("gitinsight-repository-search", handleRepositorySearch);
    return () => window.removeEventListener("gitinsight-repository-search", handleRepositorySearch);
  }, []);

  useEffect(() => {
    fetch("/api/notifications", { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data) setNotifications(data.count); })
      .catch(() => setNotifications(0));
  }, []);

  useEffect(() => {
    // Try localStorage cache first for fast display
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("github_user");
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {
          // ignore parsing errors
        }
      }
    }

    // Fetch fresh user profile from backend
    fetch("/api/auth/user")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setUser(data);
          if (typeof window !== "undefined") {
            localStorage.setItem("github_user", JSON.stringify(data));
          }
        }
      })
      .catch(() => {
        // Fallback silently if not logged in
      });
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("github_token");
      localStorage.removeItem("github_user");
      window.location.href = "/api/auth/logout";
    }
  };

  const getInitials = (name?: string | null, login?: string) => {
    const target = name || login || "User";
    const parts = target.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return target.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${sidebarCollapsed ? "lg:-translate-x-full" : "lg:translate-x-0"}`}
      >
        <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-lg bg-orange-500/10 dark:bg-zinc-950 border border-orange-500/30 dark:border-orange-500/40 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-[0_0_15px_-3px_rgba(234,88,12,0.25)] shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="12" r="3" />
              <path d="M6 9v6" />
              <path d="M9 15l6-3" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
              GitInsight
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/25">AI</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 truncate">Telemetry & Intelligence</div>
          </div>
          <button
            className="ml-auto text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
            onClick={toggleSidebar}
            title="Collapse sidebar (⌘B)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map((item) => {
            const active =
              path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  active
                    ? "bg-zinc-100 dark:bg-white/[0.08] text-zinc-950 dark:text-white border border-zinc-200 dark:border-white/[0.12] shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/[0.04]"
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    active ? "text-orange-500 dark:text-orange-400" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                  }`}
                />
                <span className="flex-1">{item.label}</span>
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" />
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* User Account Tile at Bottom */}
        <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-zinc-100/80 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.07] flex items-center gap-2.5">
          <div className="relative">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-lg object-cover ring-1 ring-zinc-300 dark:ring-white/10" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-orange-600/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 font-mono text-xs font-bold grid place-items-center">
                {getInitials(user?.name, user?.login)}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#070709]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-200">{user?.name || user?.login || "Engineer"}</div>
            <div className="truncate text-[10px] font-mono text-zinc-500">Pro Telemetry</div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? "lg:pl-0" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-20 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="h-full flex items-center justify-between gap-4 px-4 lg:px-8">
            {/* Left Group: Sidebar Toggle + Breadcrumb + Telemetry */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                className="flex items-center justify-center h-9 w-9 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-100/70 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-white/[0.06] transition cursor-pointer shrink-0"
                onClick={toggleSidebar}
                title={sidebarCollapsed ? "Expand navigation (⌘B)" : "Collapse navigation (⌘B)"}
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="h-4 w-[1px] bg-zinc-200 dark:bg-white/[0.08] hidden sm:block shrink-0" />

              <Link
                to="/repositories"
                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-100/70 dark:bg-white/[0.03] text-xs font-mono text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.14] transition truncate max-w-[240px] sm:max-w-none"
              >
                <GitBranch className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400 shrink-0" />
                <span className="truncate">{user ? `${user.login} / Repositories` : "gitinsight / projects"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
              </Link>

              {/* Live Telemetry Pill */}
              <div className="hidden xl:flex items-center gap-2 h-9 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                <span>Telemetry: Active</span>
              </div>
            </div>

            {/* Right Group: Search + Notifications + Theme Toggle + User Avatar (Flush with right edge) */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Search Bar */}
              <div className="relative w-40 sm:w-60 md:w-72 lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                <input
                  placeholder="Search telemetry, repos, PRs… (⌘K)"
                  value={search}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSearch(value);
                    setSearchOpen(true);
                    window.dispatchEvent(new CustomEvent("gitinsight-global-search", { detail: value }));
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") { setSearchOpen(false); event.currentTarget.blur(); }
                    if (event.key === "Enter") {
                      const first = searchResults.repositories[0] ?? searchResults.issues[0] ?? searchResults.users[0];
                      if (first) window.open(first.url, "_blank", "noopener,noreferrer");
                    }
                  }}
                  className="w-full h-9 pl-9 pr-12 rounded-lg bg-zinc-100/70 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/40 transition"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-zinc-200/70 dark:bg-white/[0.06] border border-zinc-300/80 dark:border-white/[0.1] text-zinc-600 dark:text-zinc-400">⌘K</kbd>
                </div>
                {search && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    aria-label="Clear global search"
                    onClick={() => {
                      setSearch("");
                      setSearchOpen(false);
                      window.dispatchEvent(new CustomEvent("gitinsight-global-search", { detail: "" }));
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {/* Search Dropdown Results */}
                {searchOpen && search.trim().length >= 1 && (
                  <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 max-h-96 overflow-y-auto rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-card dark:bg-[#0c0c10] p-2 shadow-2xl backdrop-blur-2xl">
                    {searching && <div className="px-3 py-4 text-center text-xs text-zinc-500 dark:text-zinc-400 font-mono">Searching telemetry stream...</div>}
                    {searchError && <div className="px-3 py-4 text-center text-xs text-rose-500 dark:text-rose-400 font-mono">{searchError}</div>}
                    <SearchGroup label="Repositories" results={searchResults.repositories} />
                    <SearchGroup label="GitInsight features" results={searchResults.issues} />
                    {!searching && !searchError && !searchResults.repositories.length && !searchResults.issues.length && !searchResults.users.length && (
                      <div className="px-3 py-6 text-center text-xs text-zinc-500 font-mono">No matching telemetry or repositories found.</div>
                    )}
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <button
                className="relative h-9 w-9 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-100/70 dark:bg-white/[0.03] grid place-items-center text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-white/[0.06] transition cursor-pointer shrink-0"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-rose-500 px-1 text-white text-[10px] font-mono font-bold grid place-items-center">
                    {notifications > 99 ? "99+" : notifications}
                  </span>
                )}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggle}
                className="h-9 w-9 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-100/70 dark:bg-white/[0.03] grid place-items-center text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-white/[0.06] transition cursor-pointer shrink-0"
                aria-label="Toggle theme"
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* User Profile Avatar */}
              <a
                href={user?.html_url || (user?.login ? `https://github.com/${user.login}` : "https://github.com")}
                target="_blank"
                rel="noreferrer"
                aria-label="Open GitHub profile"
                className="shrink-0"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="h-9 w-9 rounded-lg ring-1 ring-orange-500/40 object-cover shadow-[0_0_12px_-2px_rgba(234,88,12,0.3)] hover:ring-orange-500 transition"
                    title={user.name || user.login}
                  />
                ) : (
                  <div
                    className="h-9 w-9 rounded-lg bg-orange-600/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 grid place-items-center text-xs font-mono font-bold shadow-md shadow-orange-950/20"
                    title={user?.login || "User"}
                  >
                    {getInitials(user?.name, user?.login)}
                  </div>
                )}
              </a>
            </div>
          </div>
        </header>

        <main className="px-4 lg:px-8 py-6 lg:py-8 pb-24 lg:pb-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 inset-x-0 lg:hidden bg-card/95 backdrop-blur-xl border-t border-border z-30">
          <div className="grid grid-cols-5">
            {nav.slice(0, 5).map((item) => {
              const active =
                path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
                    active ? "text-brand" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label.split(" ")[0]}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
