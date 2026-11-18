import React from "react";
import { AlertCircle, Clock, CheckCircle2, ArrowRight, UserCheck, Shield } from "lucide-react";

export function TriageBoardSection() {
  return (
    <section id="triage" className="py-24 md:py-32 bg-[#060608] text-zinc-100 border-b border-white/[0.07]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-3 font-mono">
            02 PR Triage & Flow Control
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-white leading-tight mb-4">
            Fast code. Faster triage.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
            Prioritize pull requests by architectural risk and business impact to unblock engineering velocity and eliminate stale review queues.
          </p>
        </div>

        {/* Two-Column Layout (Frame 4.32s) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: High-fidelity PR Triage Board UI */}
          <div className="lg:col-span-7 rounded-xl border border-white/[0.09] bg-[#0c0c10] p-4 sm:p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08] text-xs font-mono">
              <span className="text-zinc-200 font-semibold">Triage Queue · All Repositories</span>
              <span className="text-zinc-400">Auto-prioritization Active</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Column 1: Needs Review */}
              <div className="rounded-lg bg-[#09090c] border border-white/[0.06] p-3 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pb-2 border-b border-white/[0.05]">
                  <span className="font-semibold text-zinc-200">Needs Review</span>
                  <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">3</span>
                </div>

                <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.15] transition-colors space-y-2 cursor-pointer cursor-target">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400">#342</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      Low Risk
                    </span>
                  </div>
                  <div className="text-xs font-medium text-zinc-200">Add OpenTelemetry exporter</div>
                  <div className="text-[10px] font-mono text-zinc-400 flex justify-between">
                    <span>auth-module</span>
                    <span>1.2h in queue</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.15] transition-colors space-y-2 cursor-pointer cursor-target">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400">#319</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      Low Risk
                    </span>
                  </div>
                  <div className="text-xs font-medium text-zinc-200">Bump Next.js v15.2.0</div>
                  <div className="text-[10px] font-mono text-zinc-400 flex justify-between">
                    <span>dashboard-ui</span>
                    <span>2.8h in queue</span>
                  </div>
                </div>
              </div>

              {/* Column 2: Bottlenecks & High Risk */}
              <div className="rounded-lg bg-[#09090c] border border-white/[0.06] p-3 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pb-2 border-b border-white/[0.05]">
                  <span className="font-semibold text-rose-300">Bottlenecks</span>
                  <span className="px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300 font-mono">2</span>
                </div>

                <div className="p-2.5 rounded bg-rose-500/[0.03] border border-rose-500/20 hover:border-rose-500/40 transition-colors space-y-2 cursor-pointer cursor-target">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-rose-400">#284</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                      High Risk
                    </span>
                  </div>
                  <div className="text-xs font-medium text-zinc-100">Session cache revocation</div>
                  <div className="text-[10px] font-mono text-rose-400/80 flex justify-between">
                    <span>auth-module</span>
                    <span className="font-semibold">48h stale</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-amber-500/[0.03] border border-amber-500/20 hover:border-amber-500/40 transition-colors space-y-2 cursor-pointer cursor-target">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-amber-400">#198</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Review Delay
                    </span>
                  </div>
                  <div className="text-xs font-medium text-zinc-100">DSP audio filtering</div>
                  <div className="text-[10px] font-mono text-amber-400/80 flex justify-between">
                    <span>voice-assistant</span>
                    <span>36h stale</span>
                  </div>
                </div>
              </div>

              {/* Column 3: Approved / Ready to Ship */}
              <div className="rounded-lg bg-[#09090c] border border-white/[0.06] p-3 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pb-2 border-b border-white/[0.05]">
                  <span className="font-semibold text-emerald-400">Ready to Merge</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">5</span>
                </div>

                <div className="p-2.5 rounded bg-emerald-500/[0.02] border border-emerald-500/20 hover:border-emerald-500/40 transition-colors space-y-2 cursor-pointer cursor-target">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400">#328</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      CI Passed
                    </span>
                  </div>
                  <div className="text-xs font-medium text-zinc-200">Optimize vector store query</div>
                  <div className="text-[10px] font-mono text-zinc-400 flex justify-between">
                    <span>ai-engine</span>
                    <span className="text-emerald-400">2 approvals</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-emerald-500/[0.02] border border-emerald-500/20 hover:border-emerald-500/40 transition-colors space-y-2 cursor-pointer cursor-target">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400">#315</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      CI Passed
                    </span>
                  </div>
                  <div className="text-xs font-medium text-zinc-200">K8s deployment rolling update</div>
                  <div className="text-[10px] font-mono text-zinc-400 flex justify-between">
                    <span>backend-apis</span>
                    <span className="text-emerald-400">1 approval</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Structured Feature Points (CodeRabbit composition) */}
          <div className="lg:col-span-5 flex flex-col gap-8 pt-2">
            {[
              {
                title: "Prioritize value",
                desc: "Ship changes with high release impact first. Stop letting critical patches get buried behind cosmetic refactors.",
              },
              {
                title: "Rank risk automatically",
                desc: "Fast-track safe, low-blast-radius PRs with one-click approvals, and direct senior review bandwidth to complex architectural diffs.",
              },
              {
                title: "Choose the right reviewer",
                desc: "Auto-assign engineers with direct git blame history and architectural ownership in touched modules.",
              },
              {
                title: "Understand your queue at a glance",
                desc: "A unified, real-time kanban board across all repositories so project leads spot stale pull requests before sprints slip.",
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
