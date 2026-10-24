import React from "react";
import { Check, ShieldCheck, Zap, RefreshCw, FileCode, CheckCircle2 } from "lucide-react";

export function CodeReviewSection() {
  return (
    <section id="code-review" className="py-24 md:py-32 bg-[#060608] text-zinc-100 border-b border-white/[0.07]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-3 font-mono">
            01 AI Code Review
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-white leading-tight mb-4">
            Autonomous AI code reviews.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
            GitInsight analyzes whole-repository context, architectural conventions, and commit history to validate code changes before they reach staging or production.
          </p>
        </div>

        {/* Two-Column Layout: Left = Large realistic PR Diff UI, Right = Structured Features */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left: Code Review / Diff Interface (Frame 3.24s) */}
          <div className="lg:col-span-7 rounded-xl border border-white/[0.09] bg-[#0c0c10] overflow-hidden shadow-2xl">
            {/* PR Header Bar */}
            <div className="border-b border-white/[0.08] bg-[#09090c] px-4 py-3 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-semibold">PR #284</span>
                <span className="text-zinc-300 font-medium">src/api/auth/token-service.ts</span>
                <span className="text-[10px] text-zinc-500">1/3 files</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">+42</span>
                <span className="text-rose-400">-8</span>
              </div>
            </div>

            {/* Diff Lines */}
            <div className="p-4 sm:p-5 font-mono text-xs leading-relaxed overflow-x-auto bg-[#0a0a0d]">
              <div className="text-zinc-500 text-[11px] pb-2">@@ -41,7 +41,12 @@ export async function verifySession(token: string) &#123;</div>
              
              <div className="text-zinc-400 px-3 py-0.5">  const session = await auth.lookup(token);</div>
              <div className="bg-rose-950/40 text-rose-300 px-3 py-0.5 rounded-sm flex items-center justify-between">
                <span>- if (!session.isValid) return res.status(401).send();</span>
                <span className="text-[10px] text-rose-400/80 font-sans">L42</span>
              </div>
              <div className="bg-emerald-950/40 text-emerald-300 px-3 py-0.5 rounded-sm flex items-center justify-between">
                <span>+ if (!session.isValid || session.isRevoked) &#123;</span>
                <span className="text-[10px] text-emerald-400/80 font-sans">L42</span>
              </div>
              <div className="bg-emerald-950/40 text-emerald-300 px-3 py-0.5 rounded-sm">
                <span>+   await auditLog.recordRevocation(session.id);</span>
              </div>
              <div className="bg-emerald-950/40 text-emerald-300 px-3 py-0.5 rounded-sm">
                <span>+   return res.status(401).json(&#123; error: "SESSION_REVOKED" &#125;);</span>
              </div>
              <div className="bg-emerald-950/40 text-emerald-300 px-3 py-0.5 rounded-sm">
                <span>+ &#125;</span>
              </div>
              <div className="text-zinc-400 px-3 py-0.5">  return session.user;</div>

              {/* Realistic Inline AI Review Comment Box */}
              <div className="mt-4 rounded-lg border border-indigo-500/30 bg-[#101018] p-4 font-sans text-xs space-y-3 cursor-target">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[10px] text-indigo-300 font-mono">
                      GI
                    </div>
                    <span className="font-semibold text-white">GitInsight Reviewer</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                      agent
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">reviewed 2m ago</span>
                </div>

                <div className="text-zinc-300 text-xs leading-relaxed">
                  <p className="font-medium text-amber-300 mb-1">
                    Potential distributed cache bypass:
                  </p>
                  <p className="text-zinc-400">
                    While Postgres session state is validated, edge Redis caches may still serve cached credentials for up to 15 minutes unless explicitly cleared upon revocation.
                  </p>
                </div>

                <div className="p-2.5 rounded bg-zinc-950/80 border border-white/[0.06] font-mono text-[11px] text-emerald-400">
                  <span>+ await redis.del(`auth:session:$&#123;session.userId&#125;`);</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button className="px-2.5 py-1 rounded text-[11px] font-medium bg-white text-zinc-950 hover:bg-zinc-200 transition-colors flex items-center gap-1 cursor-pointer cursor-target">
                    <Check className="w-3 h-3 text-zinc-900" />
                    Apply suggestion
                  </button>
                  <button className="px-2.5 py-1 rounded text-[11px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer cursor-target">
                    Resolve thread
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Stacked Clean Feature Callouts (CodeRabbit composition) */}
          <div className="lg:col-span-5 flex flex-col gap-8 pt-2">
            {[
              {
                title: "Dozens more points of context",
                desc: "We ingest whole-repository history, commit patterns, ASTs, and dependency trees — not just isolated diff snippets.",
              },
              {
                title: "Agent loops with reviews",
                desc: "Interactive review loops that automatically suggest verified patches to fix regressions before code lands in main.",
              },
              {
                title: "Continuous learning",
                desc: "GitInsight auto-learns from your repository's conventions, architecture guidelines, and past merge history.",
              },
              {
                title: "Pre-Merge checks & risk gating",
                desc: "Automatically gate pull requests exceeding risk thresholds or introducing untested high-blast-radius code.",
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
