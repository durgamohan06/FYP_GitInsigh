import React, { useState } from "react";
import { GitBranch, Network, Users, MessageSquare, Terminal, CheckCircle2, ArrowRight } from "lucide-react";

export function ContextEngineSection() {
  const [activeTab, setActiveTab] = useState<"graph" | "telemetry" | "milestone" | "slack">("graph");

  return (
    <section id="context" className="py-24 md:py-32 bg-[#060608] text-zinc-100 border-b border-white/[0.07]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-3 font-mono">
            04 Unified Knowledge Graph
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-white leading-tight mb-4">
            Best-in-class context.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
            Across every repository, commit, pull request, and reviewer conversation, GitInsight pulls in deep architectural context to make sense of software projects.
          </p>
        </div>

        {/* Tabbed deep dive with vertical indicator line (Frame 7.56s) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left: Vertical Tab Selection */}
          <div className="lg:col-span-4 flex flex-col space-y-3">
            {[
              {
                id: "graph",
                label: "Codegraph & AST",
                desc: "Parses whole-repo dependency structures, function calls, and cross-service blast radius.",
              },
              {
                id: "telemetry",
                label: "Adaptive Team Telemetry",
                desc: "Gathers author habits, review speed, commit times, and domain expertise per module.",
              },
              {
                id: "milestone",
                label: "Business & Sprint Milestones",
                desc: "Correlates raw pull requests with release deliverables, Jira/GitHub issues, and OKRs.",
              },
              {
                id: "slack",
                label: "Slack & Terminal Bots",
                desc: "Real-time incident, review, and blocker alerts delivered directly into engineering channels.",
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`text-left p-4 rounded-lg border transition-all cursor-pointer cursor-target ${
                    isActive
                      ? "border-emerald-500/40 bg-white/[0.03] border-l-4 border-l-emerald-400"
                      : "border-white/[0.05] bg-transparent hover:bg-white/[0.01] hover:border-white/[0.1]"
                  }`}
                >
                  <div className={`text-xs font-semibold ${isActive ? "text-white" : "text-zinc-300"}`}>
                    {tab.label}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{tab.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Right: Active Context Showcase View */}
          <div className="lg:col-span-8 rounded-xl border border-white/[0.09] bg-[#0c0c10] p-5 sm:p-6 shadow-2xl min-h-[380px] flex flex-col justify-between">
            {activeTab === "graph" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-xs font-mono">
                  <span className="text-zinc-300">AST Blast-Radius Map: auth-module → backend-apis</span>
                  <span className="text-emerald-400">8 Endpoints Affected</span>
                </div>
                <div className="p-4 rounded-lg bg-[#09090c] border border-white/[0.05] font-mono text-xs text-zinc-400 space-y-2.5">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <span className="text-emerald-400">● root:</span>
                    <span>src/api/auth/token-service.ts::revokeUserToken()</span>
                  </div>
                  <div className="pl-4 border-l border-zinc-800 space-y-2 text-[11px]">
                    <div className="text-zinc-400">├── imports: @gitinsight/redis-client::delSession()</div>
                    <div className="text-zinc-400">├── consumed by: gateway-service/proxy/auth-filter.go</div>
                    <div className="text-zinc-400">├── consumed by: billing-service/webhooks/verify.ts</div>
                    <div className="text-amber-400">└── potential impact: 4 edge microservices require synchronized deploy</div>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  GitInsight traces references across repositories so developers never merge a breaking API signature that crashes downstream microservices.
                </p>
              </div>
            )}

            {activeTab === "telemetry" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-xs font-mono">
                  <span className="text-zinc-300">Domain Ownership & Contribution Distribution</span>
                  <span className="text-zinc-400">6 Engineers</span>
                </div>
                <div className="space-y-2">
                  {[
                    { module: "src/auth/*", owner: "durga-rao (74% blame ownership)", backup: "alex-chen", health: "Healthy" },
                    { module: "src/engine/vector/*", owner: "priya-patel (82% blame ownership)", backup: "marcus-rossi", health: "Single-point-of-failure" },
                    { module: "k8s/deploy/*", owner: "alex-chen (65% blame ownership)", backup: "durga-rao", health: "Healthy" },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[#09090c] border border-white/[0.05] text-xs flex items-center justify-between cursor-target hover:border-white/[0.12] transition-colors">
                      <div>
                        <div className="font-mono text-white text-xs">{item.module}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5 font-sans">Lead: {item.owner}</div>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        item.health === "Healthy" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {item.health}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "milestone" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-xs font-mono">
                  <span className="text-zinc-300">Milestone: Release v2.4 (Target: Oct 28)</span>
                  <span className="text-emerald-400 font-semibold">92% Confidence</span>
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-[#09090c] border border-white/[0.05] space-y-1.5 cursor-target hover:border-white/[0.12] transition-colors">
                    <div className="flex justify-between text-zinc-200">
                      <span>Passkey Authentication Epic</span>
                      <span className="text-emerald-400">100% Merged</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800">
                      <div className="h-full bg-emerald-400 w-full rounded-full" />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#09090c] border border-white/[0.05] space-y-1.5 cursor-target hover:border-white/[0.12] transition-colors">
                    <div className="flex justify-between text-zinc-200">
                      <span>Voice Assistant Wake Word Epic</span>
                      <span className="text-rose-400">43% (Delayed)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800">
                      <div className="h-full bg-rose-400 w-[43%] rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "slack" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-xs font-mono">
                  <span className="text-zinc-300">#eng-alerts · Slack Bot Integration</span>
                  <span className="text-zinc-400 text-[11px]">Real-time hook</span>
                </div>
                {/* Slack Alert Mockup (Matching Frame 8.64s) */}
                <div className="p-4 rounded-lg bg-[#09090c] border border-white/[0.06] text-xs font-sans space-y-2.5 cursor-target hover:border-white/[0.15] transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                      GI
                    </div>
                    <span className="font-semibold text-white">GitInsight Bot</span>
                    <span className="text-[10px] text-zinc-400 font-mono">10:42 AM</span>
                  </div>
                  <div className="pl-7 border-l-2 border-emerald-500 space-y-1 text-zinc-300">
                    <div className="font-medium text-white">PR #284 Merged into main</div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Author: <span className="text-zinc-200">@durga-rao</span> · Reviewer: <span className="text-zinc-200">@alex-chen</span> (approved in 1.4h).
                      Sprint velocity improved by +8%. Zero regressions detected in CI test suites.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/[0.06] text-[11px] text-zinc-400 flex items-center justify-between">
              <span>Automatic GitHub webhook synchronization</span>
              <span className="text-emerald-400 font-mono text-[10px]">Zero Config</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
