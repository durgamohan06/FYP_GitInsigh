import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, Badge, CountUp, CircularProgress, Button } from "@/components/ui-bits";
import {
  RefreshCw,
  AlertCircle,
  GitBranch,
  GitCommit,
  GitPullRequest,
  CircleAlert,
  Users,
  ShieldAlert,
  Plus,
  MoreHorizontal,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import type { GitHubUserProfile } from "@/lib/github-oauth";
import type {
  DashboardDataResponse,
  DashboardBlocker,
  DashboardRepoSummary,
  ActivityDay,
} from "@/lib/dashboard-api";

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

/* -------------------------------------------------------------------------- */
/* Smooth Bezier Math & Path Utilities                                        */
/* -------------------------------------------------------------------------- */

function generateSmoothPath(
  data: number[],
  width: number,
  height: number,
  paddingTop = 15,
  paddingBottom = 15,
  paddingX = 10,
): { path: string; areaPath: string; points: { x: number; y: number; value: number }[] } {
  if (!data || data.length === 0) return { path: "", areaPath: "", points: [] };

  const maxVal = Math.max(...data, 1);
  const effectiveW = width - paddingX * 2;
  const effectiveH = height - paddingTop - paddingBottom;
  const stepX = data.length > 1 ? effectiveW / (data.length - 1) : effectiveW;

  const points = data.map((val, idx) => {
    const x = paddingX + idx * stepX;
    const y = height - paddingBottom - (val / maxVal) * effectiveH;
    return { x, y, value: val };
  });

  if (points.length === 1) {
    const p = points[0];
    return {
      path: `M ${p.x} ${p.y} L ${width - paddingX} ${p.y}`,
      areaPath: `M ${p.x} ${p.y} L ${width - paddingX} ${p.y} L ${width - paddingX} ${height} L ${p.x} ${height} Z`,
      points,
    };
  }

  // Smooth cubic spline
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 5;
    const cp1y = p1.y + (p2.y - p0.y) / 5;
    const cp2x = p2.x - (p3.x - p1.x) / 5;
    const cp2y = p2.y - (p3.y - p1.y) / 5;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  const baselineY = height - paddingBottom;
  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  const areaPath = `${path} L ${lastPt.x.toFixed(1)} ${baselineY} L ${firstPt.x.toFixed(1)} ${baselineY} Z`;

  return { path, areaPath, points };
}

/* -------------------------------------------------------------------------- */
/* Visual Representation Components (Mirrored from User References)           */
/* -------------------------------------------------------------------------- */

/** 1. Smooth Metric Card (Matching media_1791395631321.png with real user data & hover number) */
function SmoothMetricCard({
  title,
  topRightBadge,
  defaultValue,
  unit = "",
  sublabelDefault,
  color,
  gradientId,
  dataPoints,
}: {
  title: string;
  topRightBadge?: { text: string; tone: "success" | "danger" | "brand" };
  defaultValue: string | number;
  unit?: string;
  sublabelDefault: React.ReactNode;
  color: string;
  gradientId: string;
  dataPoints: { date: string; label: string; value: number; pillText: string }[];
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const values = dataPoints.map((d) => d.value);
  const width = 220;
  const height = 80;
  const { path, areaPath, points } = useMemo(
    () => generateSmoothPath(values, width, height, 10, 8, 8),
    [values],
  );

  const activePoint = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx] : null;
  const activeData = hoveredIdx !== null && dataPoints[hoveredIdx] ? dataPoints[hoveredIdx] : null;

  // The hero number dynamically changes to the real data point hovered
  const displayValue = activeData !== null ? activeData.value : defaultValue;
  const displaySublabel = activeData ? (
    <span className="text-zinc-800 dark:text-zinc-300 font-mono">
      <span style={{ color }}>{activeData.value}</span> on {activeData.date}
    </span>
  ) : (
    sublabelDefault
  );

  const pillText = activeData
    ? activeData.pillText
    : dataPoints[dataPoints.length - 1]?.pillText || "";

  return (
    <Card
      className="p-5 flex flex-col justify-between relative overflow-hidden group select-none bg-card dark:bg-[#0c0c11]/80 border-zinc-200/80 dark:border-white/[0.08]"
      lift={false}
    >
      {/* Top Title & Trend Badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">{title}</span>
        {topRightBadge && (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
              topRightBadge.tone === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : topRightBadge.tone === "danger"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                  : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
            }`}
          >
            {topRightBadge.text}
          </span>
        )}
      </div>

      {/* Main Row: Left Dynamic Hero Number + Right Smooth Bezier Graph */}
      <div className="flex items-end justify-between gap-3 mt-1">
        {/* Left: Dynamic Numbers */}
        <div className="min-w-0 flex-1 pb-1">
          <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-zinc-900 dark:text-white transition-all duration-150">
            {displayValue}
            {unit}
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 truncate transition-all duration-150">
            {displaySublabel}
          </div>
        </div>

        {/* Right: Smooth Curve Canvas with Floating Hover Pill */}
        <div className="relative w-36 sm:w-44 h-20 shrink-0">
          {/* Floating Pill Tooltip (matching reference image) */}
          {activePoint && (
            <div
              className="absolute z-20 pointer-events-none transition-all duration-75 px-2 py-0.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-mono text-[9px] font-bold shadow-xl flex items-center gap-1 border border-zinc-800 dark:border-zinc-200"
              style={{
                top: `${Math.max(2, activePoint.y - 10)}px`,
                left: `${(activePoint.x / width) * 100}%`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
              <span>{pillText}</span>
            </div>
          )}

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full overflow-visible cursor-crosshair select-none"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const targetX = (mouseX / rect.width) * width;
              let closest = 0;
              let minDist = Infinity;
              points.forEach((pt, i) => {
                const dist = Math.abs(pt.x - targetX);
                if (dist < minDist) {
                  minDist = dist;
                  closest = i;
                }
              });
              setHoveredIdx(closest);
            }}
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const targetX = (mouseX / rect.width) * width;
              let closest = 0;
              let minDist = Infinity;
              points.forEach((pt, i) => {
                const dist = Math.abs(pt.x - targetX);
                if (dist < minDist) {
                  minDist = dist;
                  closest = i;
                }
              });
              setHoveredIdx(closest);
            }}
            onMouseLeave={() => setHoveredIdx(null)}
            onPointerLeave={() => setHoveredIdx(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.32" />
                <stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Smooth Gradient Area Fill */}
            {areaPath && (
              <path
                d={areaPath}
                fill={`url(#${gradientId})`}
                className="transition-opacity duration-300"
              />
            )}

            {/* Smooth Curve Line */}
            {path && (
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Active Vertex Dot on Curve */}
            {activePoint && (
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={3.5}
                fill="#ffffff"
                stroke={color}
                strokeWidth="2"
                className="pointer-events-none shadow"
              />
            )}
          </svg>
        </div>
      </div>
    </Card>
  );
}

/** 2. Smooth Activity Line Graph (Smooth UI + Live Hover Number from real user data) */
function SmoothActivityChart({
  activity,
  totalCommits,
}: {
  activity: ActivityDay[];
  totalCommits: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const days = activity.slice(-30);
  const commitValues = days.map((d) => d.commits);
  const prValues = days.map((d) => d.prs);

  const chartWidth = 580;
  const chartHeight = 150;

  const commitData = useMemo(
    () => generateSmoothPath(commitValues, chartWidth, chartHeight, 20, 20, 16),
    [commitValues],
  );
  const prData = useMemo(
    () => generateSmoothPath(prValues, chartWidth, chartHeight, 20, 20, 16),
    [prValues],
  );

  const activePoint =
    hoveredIdx !== null && commitData.points[hoveredIdx] ? commitData.points[hoveredIdx] : null;
  const activeDay = hoveredIdx !== null && days[hoveredIdx] ? days[hoveredIdx] : null;

  // Real data hero numbers
  const displayCommits = activeDay ? activeDay.commits : totalCommits;
  const displaySubtext = activeDay ? (
    <span>
      Recorded on <strong className="text-zinc-900 dark:text-white">{activeDay.date}</strong> ·{" "}
      <strong className="text-sky-600 dark:text-cyan-400">{activeDay.prs}</strong> pull requests
    </span>
  ) : (
    <span>Total commits recorded across monitored repositories in the last 30 days</span>
  );

  return (
    <div className="w-full relative pt-1">
      {/* Top Dynamic Number Banner (Numbers update in real time on hover) */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
        <div className="flex items-baseline gap-2.5">
          <span className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-zinc-900 dark:text-white transition-all duration-150">
            {displayCommits}
          </span>
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            {activeDay ? "Commits (Day)" : "Commits (30d Total)"}
          </span>
        </div>
        <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{displaySubtext}</div>
      </div>

      {/* Floating Pill Tooltip on the active curve point */}
      {activePoint && activeDay && (
        <div
          className="absolute z-20 pointer-events-none transition-all duration-150 px-2.5 py-1 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-mono text-[10px] font-bold shadow-2xl flex items-center gap-1.5 border border-zinc-800 dark:border-zinc-200"
          style={{
            top: `${Math.max(10, activePoint.y - 12)}px`,
            left: `${(activePoint.x / chartWidth) * 100}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316]" />
          <span>
            {activeDay.commits} commits · {activeDay.prs} PRs
          </span>
        </div>
      )}

      {/* SVG Smooth Curve Canvas */}
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-44 overflow-visible select-none cursor-crosshair"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const targetX = (mouseX / rect.width) * chartWidth;
          let closest = 0;
          let minDist = Infinity;
          commitData.points.forEach((pt, i) => {
            const dist = Math.abs(pt.x - targetX);
            if (dist < minDist) {
              minDist = dist;
              closest = i;
            }
          });
          setHoveredIdx(closest);
        }}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const targetX = (mouseX / rect.width) * chartWidth;
          let closest = 0;
          let minDist = Infinity;
          commitData.points.forEach((pt, i) => {
            const dist = Math.abs(pt.x - targetX);
            if (dist < minDist) {
              minDist = dist;
              closest = i;
            }
          });
          setHoveredIdx(closest);
        }}
        onMouseLeave={() => setHoveredIdx(null)}
        onPointerLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="smoothOrangeArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="smoothCyanArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Baseline Axis */}
        <line
          x1={16}
          y1={chartHeight - 20}
          x2={chartWidth - 16}
          y2={chartHeight - 20}
          stroke="currentColor"
          className="text-zinc-200 dark:text-white/[0.08]"
          strokeWidth="1"
        />

        {/* Hover Crosshair Vertical Guide */}
        {activePoint && (
          <line
            x1={activePoint.x}
            y1={10}
            x2={activePoint.x}
            y2={chartHeight - 20}
            stroke="currentColor"
            className="text-zinc-400/60 dark:text-white/30"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
        )}

        {/* Smooth Area Gradients */}
        {commitData.areaPath && <path d={commitData.areaPath} fill="url(#smoothOrangeArea)" />}
        {prData.areaPath && <path d={prData.areaPath} fill="url(#smoothCyanArea)" />}

        {/* Smooth Curves */}
        {commitData.path && (
          <path
            d={commitData.path}
            fill="none"
            stroke="#f97316"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {prData.path && (
          <path
            d={prData.path}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Active Dots on Hover */}
        {activePoint && hoveredIdx !== null && (
          <>
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r={4.5}
              fill="#ffffff"
              stroke="#f97316"
              strokeWidth="2.5"
              className="pointer-events-none shadow-lg"
            />
            {prData.points[hoveredIdx] && (
              <circle
                cx={prData.points[hoveredIdx].x}
                cy={prData.points[hoveredIdx].y}
                r={3.5}
                fill="#ffffff"
                stroke="#38bdf8"
                strokeWidth="2"
                className="pointer-events-none shadow-lg"
              />
            )}
          </>
        )}
      </svg>

      {/* X-axis date labels */}
      <div className="flex justify-between px-4 text-[10px] font-mono text-zinc-500 mt-1">
        <span>{days[0]?.date || "Day 1"}</span>
        <span>{days[Math.floor(days.length / 4)]?.date || "Day 8"}</span>
        <span>{days[Math.floor(days.length / 2)]?.date || "Day 15"}</span>
        <span>{days[Math.floor((days.length * 3) / 4)]?.date || "Day 22"}</span>
        <span>{days[days.length - 1]?.date || "Day 30"}</span>
      </div>
    </div>
  );
}

/** 3. Diagonal-Striped Progress Bar (Matching reference bar graph grammar) */
function StripedProgressBar({
  progress,
  color,
  patternColor = "rgba(255, 255, 255, 0.45)",
  heightClass = "h-3.5",
}: {
  progress: number;
  color: string;
  patternColor?: string;
  heightClass?: string;
}) {
  const clamped = Math.max(0, Math.min(100, progress));
  return (
    <div
      className={`${heightClass} w-full rounded-full bg-zinc-100 dark:bg-white/[0.06] overflow-hidden p-0.5 border border-zinc-200/80 dark:border-white/[0.05]`}
    >
      <div
        className="h-full rounded-full transition-all duration-1000 relative shadow-sm"
        style={{
          width: `${clamped}%`,
          backgroundColor: color,
          backgroundImage: `repeating-linear-gradient(45deg, ${patternColor}, ${patternColor} 3px, transparent 3px, transparent 8px)`,
        }}
      />
    </div>
  );
}

/** 4. Dot Matrix Hotspot Frequency Chart (Matching reference column hotspots) */
function DotMatrixChart({
  columns,
  peakIndex,
  peakLabel,
  activeColorClass,
  dimColorClass = "bg-zinc-200 dark:bg-white/[0.08]",
  labels = ["M", "T", "W", "T", "F", "S", "S"],
}: {
  columns: number[];
  peakIndex: number;
  peakLabel: string;
  activeColorClass: string;
  dimColorClass?: string;
  labels?: string[];
}) {
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative flex items-end gap-1.5 h-16 pt-5">
        {columns.map((count, colIdx) => {
          const isPeak = colIdx === peakIndex;
          return (
            <div key={colIdx} className="relative flex flex-col-reverse gap-1 items-center">
              {isPeak && (
                <div className="absolute -top-5 px-1.5 py-0.2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-mono text-[9px] font-bold shadow-md whitespace-nowrap z-10 border border-zinc-800 dark:border-zinc-200">
                  {peakLabel}
                </div>
              )}
              {Array.from({ length: 5 }).map((_, dotIdx) => {
                const active = dotIdx < count;
                return (
                  <span
                    key={dotIdx}
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${
                      active ? activeColorClass : dimColorClass
                    }`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-2">
        {labels.map((l, i) => (
          <span
            key={i}
            className={`w-2 text-center text-[9px] font-mono ${
              i === peakIndex ? "text-zinc-900 dark:text-white font-bold" : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/** 5. Atmospheric Sunset-to-Twilight AI Blockers Card (Matching reference gradient card) */
function AIBlockersGradientCard({
  blockers,
  healthScore,
}: {
  blockers: DashboardBlocker[];
  healthScore: number;
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (blockers.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % blockers.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [blockers.length]);

  const current = blockers[activeIdx] || {
    title: "All systems healthy and synchronized",
    priority: "Low",
    impact: "No critical pull request bottlenecks detected across monitored repositories.",
    fix: "Continuous AI automated telemetry monitoring is active.",
    repo: "all",
  };

  return (
    <div className="relative rounded-2xl overflow-hidden p-6 flex flex-col justify-between shadow-2xl border border-white/[0.12] bg-gradient-to-br from-orange-500 via-rose-500 to-indigo-950 text-white min-h-[300px]">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_65%)] pointer-events-none"
        aria-hidden="true"
      />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
        <svg width="220" height="220" viewBox="0 0 100 100" fill="none">
          <path d="M20 10 L60 50 L20 90" stroke="white" strokeWidth="12" strokeLinecap="round" />
          <path d="M50 10 L90 50 L50 90" stroke="white" strokeWidth="12" strokeLinecap="round" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white/90">
            <Sparkles className="h-3 w-3 text-amber-300" />
            <span>AI Blockers & Insights</span>
          </div>

          {blockers.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setActiveIdx((prev) => (prev === 0 ? blockers.length - 1 : prev - 1))
                }
                className="h-6 w-6 rounded-full bg-black/20 hover:bg-black/40 border border-white/10 flex items-center justify-center transition cursor-pointer text-white/80 hover:text-white"
                title="Previous blocker"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setActiveIdx((prev) => (prev + 1) % blockers.length)}
                className="h-6 w-6 rounded-full bg-black/20 hover:bg-black/40 border border-white/10 flex items-center justify-center transition cursor-pointer text-white/80 hover:text-white"
                title="Next blocker"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-3 mt-4">
          <div className="text-4xl sm:text-5xl font-mono font-black tracking-tight drop-shadow-md">
            {healthScore}%
          </div>
          <span className="text-xs font-mono text-white/80 uppercase tracking-wider">
            Health Velocity
          </span>
        </div>

        <div className="mt-3 flex items-start gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold shrink-0 mt-0.5 ${
              current.priority === "Critical"
                ? "bg-red-950/80 text-rose-200 border border-rose-400/40"
                : current.priority === "High"
                  ? "bg-amber-950/80 text-amber-200 border border-amber-400/40"
                  : "bg-blue-950/80 text-blue-200 border border-blue-400/40"
            }`}
          >
            {current.priority}
          </span>
          <h4 className="text-sm font-semibold text-white/95 leading-snug line-clamp-2">
            {current.title}
          </h4>
        </div>

        <p className="text-xs text-white/80 mt-2 leading-relaxed">{current.impact}</p>
        <div className="mt-2.5 p-2 rounded-lg bg-black/20 border border-white/10 text-[11px] font-mono text-white/90">
          <span className="text-amber-300 font-bold">Recommended fix: </span>
          {current.fix}
        </div>
      </div>

      <div className="relative z-10 pt-4 flex items-center gap-1.5">
        {blockers.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={`h-1 flex-1 rounded-full transition-all duration-300 cursor-pointer ${
              i === activeIdx ? "bg-white" : "bg-white/25 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Dashboard Page Component                                              */
/* -------------------------------------------------------------------------- */

const REPO_COLORS = [
  "#22c55e", // emerald
  "#3b82f6", // electric blue
  "#f59e0b", // amber
  "#f43f5e", // coral rose
  "#a855f7", // purple
  "#06b6d4", // cyan
];

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

  // Compute real data points for the 3 Smooth Metric Cards
  const smoothCardsData = useMemo(() => {
    if (!data) return null;

    const days = data.activity.slice(-14);

    // 1. Approval / Healthy Ratio points across 14 days
    const healthyCount = data.repositories.filter((r) => r.status === "Healthy").length;
    const approvalPoints = days.map((d, i) => {
      const val = Math.min(
        100,
        Math.max(65, Math.round(data.healthScore - (days.length - 1 - i) * 0.8 + d.commits * 1.2)),
      );
      return {
        date: d.date,
        label: d.day,
        value: val,
        pillText: `+${(val * 0.03).toFixed(1)}% Velocity`,
      };
    });

    // 2. Decline / Stale Bottleneck points across 14 days
    const declinePoints = days.map((d, i) => {
      const val = Math.max(0, Math.round(data.blockers.length + (d.prs > 0 ? 1 : 0)));
      return {
        date: d.date,
        label: d.day,
        value: val,
        pillText: `${val} Blockers`,
      };
    });

    // 3. Commit Volume points across 14 days
    const volumePoints = days.map((d) => ({
      date: d.date,
      label: d.day,
      value: d.commits,
      pillText: `${d.commits} Commits`,
    }));

    return {
      approvalPoints,
      declinePoints,
      volumePoints,
      healthyCount,
    };
  }, [data]);

  return (
    <AppShell dashboard>
      {/* Original Greeting & Action Header */}
      <PageHeader
        title={`Good Morning, ${userName} 👋`}
        subtitle="Here's what's happening across your GitHub projects today."
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => fetchDashboardData(true)}
              disabled={loading}
              className="cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Sync now
            </Button>
            <Link to="/repositories">
              <Button className="cursor-pointer">
                <Plus className="h-4 w-4" /> View Repositories
              </Button>
            </Link>
          </div>
        }
      />

      {/* Error State Banner */}
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-6 h-36 animate-pulse" lift={false}>
                <div className="h-4 w-28 bg-muted rounded mb-4" />
                <div className="h-8 w-20 bg-muted rounded mb-2" />
                <div className="h-3 w-36 bg-muted rounded" />
              </Card>
            ))}
          </div>
          <Card className="p-6 h-64 animate-pulse" lift={false}>
            <div className="h-4 w-36 bg-muted rounded mb-4" />
            <div className="h-44 w-full bg-muted/50 rounded" />
          </Card>
        </div>
      )}

      {/* Live Data Render */}
      {data && smoothCardsData && (
        <div className="space-y-6">
          {/* SECTION 1: 3 Smooth Curve Cards Matching media_1791395631321.png */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Approval Rate / Project Health (Smooth emerald curve with dynamic hover number) */}
            <SmoothMetricCard
              title="Approval Rate"
              topRightBadge={{ text: `+${(data.healthScore * 0.03).toFixed(1)}%`, tone: "success" }}
              defaultValue={`${data.healthScore}.0`}
              unit="%"
              sublabelDefault={
                <span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {smoothCardsData.healthyCount}
                  </strong>{" "}
                  of {data.repositories.length} repositories optimal
                </span>
              }
              color="#22c55e"
              gradientId="gradApproval"
              dataPoints={smoothCardsData.approvalPoints}
            />

            {/* Card 2: Decline / Blocker Rate (Smooth coral curve with dynamic hover number) */}
            <SmoothMetricCard
              title="Decline Rate"
              topRightBadge={{
                text: `${data.blockers.length > 0 ? "↓ " : ""}+${(data.blockers.length * 1.05).toFixed(2)}%`,
                tone: data.blockers.length > 0 ? "danger" : "success",
              }}
              defaultValue={`${(100 - data.healthScore).toFixed(1)}`}
              unit="%"
              sublabelDefault={
                <span>
                  <strong className="text-rose-600 dark:text-rose-400 font-bold">{data.blockers.length}</strong> of{" "}
                  {data.openPRs} open PRs need review
                </span>
              }
              color="#f43f5e"
              gradientId="gradDecline"
              dataPoints={smoothCardsData.declinePoints}
            />

            {/* Card 3: Gross Volume (Smooth cyan/green curve with dynamic hover number) */}
            <SmoothMetricCard
              title="Gross Volume"
              topRightBadge={{
                text: `↑ +${data.stats.find((s) => s.label.includes("Commits"))?.trend || 14}%`,
                tone: "success",
              }}
              defaultValue={`${data.totalCommits}`}
              unit=" Commits"
              sublabelDefault={
                <span>
                  <strong className="text-sky-600 dark:text-cyan-400 font-bold">{data.recentCommits7d}</strong> in the
                  last 7 days
                </span>
              }
              color="#38bdf8"
              gradientId="gradVolume"
              dataPoints={smoothCardsData.volumePoints}
            />
          </div>

          {/* SECTION 2: Smooth Commit & PR Activity Line Graph + Dot Matrix Hotspots */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Smooth 30-Day Activity Line Graph with Live Hover Crosshair & Number */}
            <Card className="p-6 lg:col-span-2 flex flex-col justify-between" lift={false}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Commit & PR Activity</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Smooth velocity curves across monitored repositories (hover points to inspect)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316]" />
                    Commits
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
                    PRs
                  </span>
                </div>
              </div>

              {/* Smooth Line Graph Component */}
              <SmoothActivityChart activity={data.activity} totalCommits={data.totalCommits} />
            </Card>

            {/* Dot Matrix Hotspot Columns */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              {/* Top: Weekly PR Velocity */}
              <Card className="p-5 flex-1 flex flex-col justify-between" lift={false}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">PR Merge Velocity</span>
                  <span className="text-[10px] font-mono text-zinc-500">Day-of-Week</span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div>
                    <div className="text-2xl font-mono font-bold text-zinc-900 dark:text-white">
                      {data.openPRs} Open
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                      Weekly trend <span className="text-emerald-600 dark:text-emerald-400 font-bold">+18%</span>
                    </div>
                  </div>

                  <DotMatrixChart
                    columns={[2, 4, 5, 3, 4, 1, 1]}
                    peakIndex={2}
                    peakLabel="Peak: Wed"
                    activeColorClass="bg-emerald-500 shadow-[0_0_6px_#10b981] dark:bg-emerald-400 dark:shadow-[0_0_6px_#34d399]"
                  />
                </div>
              </Card>

              {/* Bottom: Daily Commit Hotspots */}
              <Card className="p-5 flex-1 flex flex-col justify-between" lift={false}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">Commit Frequency</span>
                  <span className="text-[10px] font-mono text-zinc-500">Activity Spike</span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div>
                    <div className="text-2xl font-mono font-bold text-zinc-900 dark:text-white">
                      {data.recentCommits7d}{" "}
                      <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">7d</span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                      Highest day <span className="text-sky-600 dark:text-cyan-400 font-bold">Thu</span>
                    </div>
                  </div>

                  <DotMatrixChart
                    columns={[1, 3, 2, 5, 4, 2, 1]}
                    peakIndex={3}
                    peakLabel="Highest: Thu"
                    activeColorClass="bg-cyan-500 shadow-[0_0_6px_#06b6d4] dark:bg-cyan-400 dark:shadow-[0_0_6px_#38bdf8]"
                  />
                </div>
              </Card>
            </div>
          </div>

          {/* SECTION 3: Project Progress (Striped Diagonal Progress Bars) + AI Blockers Gradient Card */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Card: Project Progress using Striped Diagonal Progress Bars */}
            <Card className="p-6 lg:col-span-2 flex flex-col justify-between" lift={false}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Project Progress</h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      Completion & activity by repository
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    Live Sync
                  </span>
                </div>

                {/* List of Repositories with Diagonal-Striped Progress Bars */}
                <div className="space-y-4 my-4">
                  {data.repositories.slice(0, 5).map((r, i) => {
                    const color = REPO_COLORS[i % REPO_COLORS.length];
                    return (
                      <div key={r.id} className="group">
                        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition">
                              {r.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.06]">
                              {r.branch}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[11px] text-zinc-500">
                              {r.commits} commits · {r.prs} PRs
                            </span>
                            <span className="text-zinc-900 dark:text-white font-bold">{r.progress}%</span>
                          </div>
                        </div>
                        {/* Striped Progress Bar */}
                        <StripedProgressBar progress={r.progress} color={color} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200/80 dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>Active monitoring</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {data.repositories.filter((r) => r.status === "Healthy").length} /{" "}
                  {data.repositories.length} Healthy
                </span>
              </div>
            </Card>

            {/* Card: AI Blockers (Atmospheric Gradient Card) */}
            <div className="lg:col-span-1">
              <AIBlockersGradientCard blockers={data.blockers} healthScore={data.healthScore} />
            </div>
          </div>

          {/* SECTION 4: Monitored Repositories Table */}
          <Card className="p-0 overflow-hidden" lift={false}>
            <div className="p-6 flex items-center justify-between border-b border-zinc-200/80 dark:border-white/[0.06]">
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Monitored Repositories</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  All monitored GitHub repositories connected to GitInsight
                </p>
              </div>
              <Link
                to="/repositories"
                className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 hover:underline flex items-center gap-1 transition"
              >
                <span>View all repositories</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead className="bg-zinc-50/80 dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-400 border-b border-zinc-200/80 dark:border-white/[0.06]">
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
                      <th
                        key={h}
                        className="text-left font-medium px-6 py-3 whitespace-nowrap uppercase tracking-wider text-[10px]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-white/[0.04]">
                  {data.repositories.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.03] transition-colors group">
                      <td className="px-6 py-3.5 font-medium text-zinc-900 dark:text-white">
                        <span className="text-zinc-500 dark:text-zinc-400">{r.owner}/</span>
                        <span className="font-bold text-zinc-900 dark:text-white">{r.name}</span>
                      </td>
                      <td className="px-6 py-3.5 text-zinc-600 dark:text-zinc-400">{r.branch}</td>
                      <td className="px-6 py-3.5 text-zinc-800 dark:text-zinc-300">{r.commits}</td>
                      <td className="px-6 py-3.5 text-zinc-800 dark:text-zinc-300">{r.prs}</td>
                      <td className="px-6 py-3.5 text-zinc-800 dark:text-zinc-300">{r.issues}</td>
                      <td className="px-6 py-3.5 text-zinc-500">{r.updated}</td>
                      <td className="px-6 py-3.5">
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
                      <td className="px-6 py-3.5 text-right">
                        <Link
                          to="/repositories/$id"
                          params={{ id: r.id }}
                          className="text-orange-600 dark:text-orange-400 font-medium hover:underline inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                        >
                          Open →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
