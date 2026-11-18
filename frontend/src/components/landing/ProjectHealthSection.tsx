import React from "react";
import { Activity, ShieldCheck, TrendingUp, AlertTriangle } from "lucide-react";

export function ProjectHealthSection() {
  return (
    <section id="project-health" className="py-24 md:py-32 bg-[#060608] text-zinc-100 border-b border-white/[0.07]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-3 font-mono">
            03 Engineering Telemetry
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-white leading-tight mb-4">
            Continuous project health monitoring.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
            Ditch outdated retrospective spreadsheets. GitInsight continuously analyzes commits, reviews, and cycle times to surface release risks before deadlines slip.
          </p>
        </div>

        {/* Two-Column Layout (Frame 6.48s) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Full Dashboard UI (Heatmap + Velocity chart + Health breakdown) */}
          <div className="lg:col-span-7 rounded-xl border border-white/[0.09] bg-[#0c0c10] p-4 sm:p-6 shadow-2xl space-y-6">
            {/* Top Stat Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Active Repos", val: "12", sub: "+2 this week" },
                { label: "Commits Today", val: "156", sub: "14% vs avg" },
                { label: "Avg Cycle Time", val: "2.4h", sub: "-42% turnaround" },
                { label: "Project Health", val: "94%", sub: "Release on track" },
              ].map((stat, i) => (
                <div key={i} className="p-3 rounded-lg border border-white/[0.06] bg-[#09090c] hover:border-white/[0.15] transition-colors cursor-target">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">{stat.label}</div>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">{stat.val}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Commit Heatmap Grid */}
            <div className="p-4 rounded-lg border border-white/[0.06] bg-[#09090c] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-200 font-semibold">Repository Contribution Heatmap</span>
                <span className="text-zinc-400 text-[11px]">Last 26 Weeks</span>
              </div>
              
              {/* Matrix of commit blocks */}
              <div className="grid grid-cols-13 sm:grid-cols-26 gap-1 py-1">
                {Array.from({ length: 78 }).map((_, i) => {
                  const val = ((i * 13 + 7) % 5);
                  const colors = [
                    "bg-zinc-800/40",
                    "bg-emerald-950/60",
                    "bg-emerald-800/80",
                    "bg-emerald-600",
                    "bg-emerald-400",
                  ];
                  return (
                    <div
                      key={i}
                      className={`h-3 rounded-xs ${colors[val]} transition-all hover:scale-125 cursor-pointer cursor-target`}
                      title={`Week ${Math.floor(i / 3) + 1} activity: ${val * 12} commits`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
                <span>Low commit volume</span>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-zinc-800" />
                  <span className="w-2 h-2 rounded-xs bg-emerald-950" />
                  <span className="w-2 h-2 rounded-xs bg-emerald-800" />
                  <span className="w-2 h-2 rounded-xs bg-emerald-600" />
                  <span className="w-2 h-2 rounded-xs bg-emerald-400" />
                </div>
                <span>Peak commit volume</span>
              </div>
            </div>

            {/* Sprint Velocity Area Indicator */}
            <div className="p-4 rounded-lg border border-white/[0.06] bg-[#09090c] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-200 font-semibold">PR Cycle Time Velocity (Hours to Merge)</span>
                <span className="text-emerald-400 text-[11px] font-bold">42% Faster</span>
              </div>
              {/* Clean bar simulation for responsive consistency */}
              <div className="h-28 flex items-end gap-1.5 pt-4">
                {[65, 58, 62, 54, 48, 50, 42, 38, 32, 28, 22, 18, 16, 14].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-target">
                    <div
                      className="w-full bg-indigo-500/30 group-hover:bg-indigo-400/80 rounded-xs transition-colors"
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[9px] font-mono text-zinc-500">W{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Feature Points (Frame 6.48s) */}
          <div className="lg:col-span-5 flex flex-col gap-8 pt-2">
            {[
              {
                title: "All risks detected in real time",
                desc: "Instant alerts on branch drift, abandoned pull requests, and unusual drops in test coverage before they affect releases.",
              },
              {
                title: "Beyond raw commit metrics",
                desc: "Avoid vanity metrics like raw line counts. GitInsight measures architectural throughput, code reviews, and cycle times.",
              },
              {
                title: "Continuous project telemetry",
                desc: "Automated digests keep executives and engineering leads aligned without requiring manual developer status updates.",
              },
              {
                title: "Verify & remediate bottlenecks",
                desc: "AI identifies stalled reviews and proactively recommends reviewer re-assignments and PR splitting strategies.",
              },
            ].map((feature, i) => (
              <div key={i} className="space-y-1.5 border-l border-white/[0.08] hover:border-emerald-500/60 transition-colors pl-5 cursor-target">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed font-normal">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
