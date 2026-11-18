import React, { useState, useEffect, useRef } from "react";
import {
  Github,
  ArrowRight,
  Check,
  AlertTriangle,
  Layers,
  FileCode,
  ShieldCheck,
  ShieldAlert,
  GitPullRequest,
  CheckCircle2,
  Pause,
  Play,
  ExternalLink,
  ChevronRight,
  Users,
} from "lucide-react";

interface HeroSectionProps {
  handleGitHubLogin: () => void;
  loggingIn: boolean;
}

const PHRASES = ["predicting it.", "unblocking it.", "delivering it."];

function RotatingHeadlineWord() {
  return (
    <span className="hero-phrase-cycle inline-grid align-baseline overflow-hidden relative" data-animation-active="true">
      <span
        aria-hidden="true"
        className="inline-grid [grid-template-columns:1fr] [grid-template-rows:1fr] overflow-hidden align-baseline"
      >
        {PHRASES.map((phrase, pIdx) => {
          const totalChars = phrase.length;
          return (
            <span key={pIdx} className="hero-phrase-item inline-flex items-baseline whitespace-pre [grid-area:1/1]">
              {phrase.split("").map((char, cIdx) => {
                const isPunctuationOrSpace = char === " " || char === "." || char === ",";
                const isNegative = cIdx % 3 === 1;
                const accent = isNegative ? "negative" : "positive";
                const slideIn = isNegative ? "-115%" : "115%";
                const slideOut = isNegative ? "115%" : "-115%";
                const delay = `${(cIdx * (0.184 / Math.max(1, totalChars - 1))).toFixed(4)}s`;

                return (
                  <span
                    key={cIdx}
                    className="hero-phrase-char inline-grid relative overflow-clip align-baseline whitespace-pre"
                    data-accent={accent}
                    style={{
                      ["--character-delay" as any]: delay,
                      ["--slide-in" as any]: slideIn,
                      ["--slide-out" as any]: slideOut,
                    }}
                  >
                    <span
                      className="hero-phrase-motion text-white [grid-area:1/1]"
                      data-character={char}
                      data-has-color={!isPunctuationOrSpace ? "true" : "false"}
                    >
                      {char === " " ? "\u00A0" : char}
                    </span>
                  </span>
                );
              })}
            </span>
          );
        })}
      </span>
      <span className="sr-only">predicting it.</span>
    </span>
  );
}

export function HeroSection({ handleGitHubLogin, loggingIn }: HeroSectionProps) {
  const [activeCard, setActiveCard] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-play timer cycling every 5 seconds unless paused or hovered
  useEffect(() => {
    if (isPaused) {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
      return;
    }

    autoPlayTimer.current = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % 4);
    }, 5000);

    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [isPaused]);

  return (
    <section id="overview" className="relative pt-24 pb-20 md:pt-32 md:pb-28 bg-[#060608] text-zinc-100 overflow-hidden">
      {/* Subtle top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-indigo-500/[0.035] blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Eyebrow badge */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400 font-mono">
            AI-POWERED GITHUB PROJECT INTELLIGENCE
          </span>
        </div>

        {/* Top split row: Headline on Left (8 cols), Paragraph + CTA on Right (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start mb-14 lg:mb-16">
          <div className="lg:col-span-8 min-w-0">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] xl:text-[46px] font-medium tracking-[-0.03em] text-white leading-[1.14]">
              <span className="block">Shipping software isn't chasing status.</span>
              <span className="block mt-1 sm:mt-1.5">
                <span className="text-zinc-400 font-normal">It's </span>
                <RotatingHeadlineWord />
              </span>
            </h1>
          </div>

          <div className="lg:col-span-4 min-w-0 flex flex-col items-start lg:pl-2 pt-1.5">
            <p className="text-[14px] sm:text-[15px] text-zinc-400 leading-relaxed mb-6 font-normal">
              Engineering leaders outpace manual status tracking. GitInsight gives teams real-time sprint predictability, unblocks PR bottlenecks, and prevents release surprises.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleGitHubLogin}
                disabled={loggingIn}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-all cursor-pointer shadow-sm disabled:opacity-60 cursor-target group"
              >
                <Github className="w-4 h-4 text-zinc-900" />
                <span>{loggingIn ? "Connecting..." : "Try it for free"}</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a
                href="#code-review"
                className="text-xs font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-target"
              >
                <span>Explore Workflow</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CODERABBIT-STYLE EXPANDING 4-CARD ACCORDION (Matches Reference Images)
            Hovering on any card expands it into full focus, while the other 3 collapse
            ========================================================================= */}
        <div
          className="relative rounded-xl border border-white/[0.09] bg-[#0c0c10] shadow-2xl overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Main Flex Row of 4 Expanding Panels */}
          <div className="flex flex-col lg:flex-row h-[580px] w-full divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] relative">

            {/* -------------------------------------------------------------
                CARD 01: REVIEW EVERY PR AUTOMATICALLY
                ------------------------------------------------------------- */}
            <div
              onMouseEnter={() => setActiveCard(0)}
              onClick={() => setActiveCard(0)}
              className={`transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col relative overflow-hidden ${
                activeCard === 0
                  ? "lg:flex-[4] bg-[#0c0c10] opacity-100 z-10"
                  : "lg:flex-[0.8] bg-[#08080b] opacity-45 hover:opacity-80 cursor-pointer cursor-target"
              }`}
            >
              {/* Dimmed overlay when collapsed */}
              {activeCard !== 0 && (
                <div className="absolute inset-0 bg-[#08080b]/50 z-20 pointer-events-none transition-opacity" />
              )}

              {/* Card Header Tab */}
              <div className="h-12 border-b border-white/[0.08] px-4 sm:px-5 flex items-center justify-between bg-[#09090d] shrink-0 z-30">
                <div className="flex items-center gap-2 text-xs font-mono font-medium truncate">
                  <span className={activeCard === 0 ? "text-emerald-400 font-bold" : "text-zinc-500"}>01</span>
                  <span className={activeCard === 0 ? "text-white font-semibold" : "text-zinc-400"}>
                    Review
                  </span>
                  {activeCard === 0 && (
                    <span className="hidden sm:inline text-zinc-400 font-normal">
                      every PR automatically
                    </span>
                  )}
                </div>
                {activeCard === 0 && (
                  <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                    Live Agent
                  </span>
                )}
              </div>

              {/* Card Body Content */}
              <div
                className={`p-4 sm:p-6 flex-1 font-sans text-xs flex flex-col justify-between space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                  activeCard === 0 ? "overflow-y-auto" : "overflow-hidden pointer-events-none select-none"
                }`}
              >
                <div className="space-y-4 min-w-[460px]">
                  {/* PR Breadcrumb Header */}
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-200 font-semibold">gitinsight/platform #482</span>
                      <span className="text-[10px] text-zinc-500">1 of 3 reviews</span>
                    </div>
                    <span className="text-emerald-400">+12 -3 lines</span>
                  </div>

                  {/* Primary Review Bot Card */}
                  <div className="rounded-lg border border-white/[0.08] bg-[#101015] p-4 sm:p-5 space-y-3.5 shadow-lg">
                    {/* Bot Title Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                          GI
                        </div>
                        <span className="font-semibold text-white">gitinsightai</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                          bot
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 font-mono">commented 2 minutes ago</span>
                    </div>

                    {/* Change Stack Pill Action */}
                    <button className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 border border-white/10 transition-colors cursor-target">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span>Review Change Stack</span>
                      <ArrowRight className="w-3 h-3 text-zinc-400" />
                    </button>

                    {/* Alert Headline & Description */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Potential issue | Major</span>
                      </div>
                      <p className="font-semibold text-white text-xs">
                        Reject expired refresh tokens before issuing a session.
                      </p>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Check the token expiry in distributed Redis store before creating a new authenticated session.
                      </p>
                    </div>

                    {/* Diff Code Snippet */}
                    <div className="rounded bg-[#07070a] border border-white/[0.06] p-3 font-mono text-[11px] space-y-1 text-zinc-400">
                      <div className="text-zinc-500">@@ -42,2 +42,3 @@ export async function createSession</div>
                      <div className="bg-rose-950/40 text-rose-300 px-2 py-0.5 rounded -mx-1 flex justify-between">
                        <span>− return issueSession(payload.userId);</span>
                      </div>
                      <div className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded -mx-1">
                        <span>+ if (payload.expiresAt &lt;= Date.now()) return null;</span>
                      </div>
                      <div className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded -mx-1">
                        <span>+ return issueSession(payload.userId);</span>
                      </div>
                    </div>

                    {/* Committable suggestion button */}
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <button className="text-zinc-300 hover:text-white flex items-center gap-1 font-mono cursor-target">
                        <span>▶ Committable suggestion</span>
                      </button>
                      <button className="px-3 py-1 rounded bg-white text-zinc-950 font-semibold text-[11px] hover:bg-zinc-200 transition-colors cursor-target">
                        Apply Suggestion
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Secondary Comment Peeking */}
                <div className="rounded-lg border border-white/[0.05] bg-[#0d0d12] p-3 opacity-60 flex items-center gap-3">
                  <div className="w-5 h-5 rounded bg-zinc-800 text-zinc-400 flex items-center justify-center text-[10px]">
                    GI
                  </div>
                  <span className="text-zinc-400 text-xs">gitinsightai bot commented just now</span>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------------
                CARD 02: PRIORITIZE ACROSS ALL PRS (Kanban Queue)
                ------------------------------------------------------------- */}
            <div
              onMouseEnter={() => setActiveCard(1)}
              onClick={() => setActiveCard(1)}
              className={`transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col relative overflow-hidden ${
                activeCard === 1
                  ? "lg:flex-[4] bg-[#0c0c10] opacity-100 z-10"
                  : "lg:flex-[0.8] bg-[#08080b] opacity-45 hover:opacity-80 cursor-pointer cursor-target"
              }`}
            >
              {/* Dimmed overlay when collapsed */}
              {activeCard !== 1 && (
                <div className="absolute inset-0 bg-[#08080b]/50 z-20 pointer-events-none transition-opacity" />
              )}

              {/* Card Header Tab */}
              <div className="h-12 border-b border-white/[0.08] px-4 sm:px-5 flex items-center justify-between bg-[#09090d] shrink-0 z-30">
                <div className="flex items-center gap-2 text-xs font-mono font-medium truncate">
                  <span className={activeCard === 1 ? "text-emerald-400 font-bold" : "text-zinc-500"}>02</span>
                  <span className={activeCard === 1 ? "text-white font-semibold" : "text-zinc-400"}>
                    Prioritize
                  </span>
                  {activeCard === 1 && (
                    <span className="hidden sm:inline text-zinc-400 font-normal">
                      across all PRs
                    </span>
                  )}
                </div>
                {activeCard === 1 && (
                  <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-800 border border-white/10 shrink-0">
                    Queue Triage
                  </span>
                )}
              </div>

              {/* Card Body: Kanban Columns (Now vs Next) */}
              <div
                className={`p-4 sm:p-6 flex-1 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                  activeCard === 1 ? "overflow-y-auto" : "overflow-hidden pointer-events-none select-none"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-[500px]">
                  {/* Column: NOW */}
                  <div className="rounded-lg border border-white/[0.06] bg-[#09090c] p-3.5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-white/[0.06]">
                      <div>
                        <span className="font-semibold text-white">Now</span>
                        <div className="text-[10px] text-zinc-400">Within each person's daily capacity</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">14</span>
                    </div>

                    {/* Task Card 1 */}
                    <div className="rounded-md border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] p-3 space-y-2 cursor-target">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-300 font-mono">● P0</span>
                        <span className="text-xs font-semibold text-white">Skip bot-authored comment review tasks</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Review this early because it can resolve assumptions that may affect nearby PRs and reduce rework.
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono pt-1 text-zinc-400">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800/80">Low security risk</span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800/80">Maintenance</span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800/80">Deep review</span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 flex justify-between pt-1 border-t border-white/[0.04]">
                        <span>lop #21102 · @durga-rao</span>
                        <span className="text-emerald-400">2h in queue</span>
                      </div>
                    </div>

                    {/* Task Card 2 */}
                    <div className="rounded-md border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] p-3 space-y-2 cursor-target">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">● P1</span>
                        <span className="text-xs font-semibold text-white">feat(agents): extend prompt cache key</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Auto-assigned to Alex Chen based on past git blame in vector engine pipeline.
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono pt-1 text-zinc-400">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800/80">Feature</span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800/80">Deep review</span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 flex justify-between pt-1 border-t border-white/[0.04]">
                        <span>rex #21194 · @alex-chen</span>
                        <span className="text-zinc-400">4h in queue</span>
                      </div>
                    </div>
                  </div>

                  {/* Column: NEXT */}
                  <div className="rounded-lg border border-white/[0.06] bg-[#09090c] p-3.5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-white/[0.06]">
                      <div>
                        <span className="font-semibold text-white">Next</span>
                        <div className="text-[10px] text-zinc-400">All remaining reviews</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">66</span>
                    </div>

                    {/* Task Card 1 */}
                    <div className="rounded-md border border-white/[0.06] bg-white/[0.015] p-3 space-y-2 cursor-target">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">● P1</span>
                        <span className="text-xs font-semibold text-white">fix(dashboard): scope PR details authors by org</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Keep this visible for async review because it is useful work without an immediate interruption signal.
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono pt-1 text-zinc-400">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800/80">Low risk</span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800/80">Standard review</span>
                      </div>
                    </div>

                    {/* Task Card 2 */}
                    <div className="rounded-md border border-white/[0.06] bg-white/[0.015] p-3 space-y-2 cursor-target">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-700 text-zinc-300 font-mono">● P2</span>
                        <span className="text-xs font-semibold text-white">[codex] Lean path instruction metrics insert</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Hold this behind refresh work because draft signals would make reviewer attention premature.
                      </p>
                      <div className="text-[10px] font-mono text-zinc-500 flex justify-between pt-1 border-t border-white/[0.04]">
                        <span>silver #21153 · @priya-patel</span>
                        <span className="text-amber-400">Draft</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------------
                CARD 03: UNDERSTAND EACH PR'S IMPACT (Diff + Layers)
                ------------------------------------------------------------- */}
            <div
              onMouseEnter={() => setActiveCard(2)}
              onClick={() => setActiveCard(2)}
              className={`transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col relative overflow-hidden ${
                activeCard === 2
                  ? "lg:flex-[4] bg-[#0c0c10] opacity-100 z-10"
                  : "lg:flex-[0.8] bg-[#08080b] opacity-45 hover:opacity-80 cursor-pointer cursor-target"
              }`}
            >
              {/* Dimmed overlay when collapsed */}
              {activeCard !== 2 && (
                <div className="absolute inset-0 bg-[#08080b]/50 z-20 pointer-events-none transition-opacity" />
              )}

              {/* Card Header Tab */}
              <div className="h-12 border-b border-white/[0.08] px-4 sm:px-5 flex items-center justify-between bg-[#09090d] shrink-0 z-30">
                <div className="flex items-center gap-2 text-xs font-mono font-medium truncate">
                  <span className={activeCard === 2 ? "text-emerald-400 font-bold" : "text-zinc-500"}>03</span>
                  <span className={activeCard === 2 ? "text-white font-semibold" : "text-zinc-400"}>
                    Understand
                  </span>
                  {activeCard === 2 && (
                    <span className="hidden sm:inline text-zinc-400 font-normal">
                      each PR's impact
                    </span>
                  )}
                </div>
                {activeCard === 2 && (
                  <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                    AST Blast Radius
                  </span>
                )}
              </div>

              {/* Card Body: PR Impact Explorer */}
              <div
                className={`p-4 sm:p-6 flex-1 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                  activeCard === 2 ? "overflow-y-auto" : "overflow-hidden pointer-events-none select-none"
                }`}
              >
                <div className="space-y-4 min-w-[500px]">
                  {/* PR Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-mono">
                        Open
                      </span>
                      <span className="font-semibold text-white">Add teammate invitations with roles</span>
                      <span className="text-zinc-400 font-mono text-[11px]">| gitinsight/web-app #482 · 9 files</span>
                    </div>
                    <button className="px-3 py-1 rounded bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition-colors cursor-target">
                      Submit review
                    </button>
                  </div>

                  {/* Sub Layout: Left Layers/Files Sidebar, Right Diff Pane */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    {/* Left Sidebar */}
                    <div className="md:col-span-4 rounded-lg border border-white/[0.06] bg-[#09090c] p-3 space-y-3 font-mono text-[11px]">
                      <div className="flex items-center gap-3 border-b border-white/[0.06] pb-2 text-zinc-400">
                        <span className="text-white font-semibold flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" /> Layers
                        </span>
                        <span>Files</span>
                      </div>

                      <div className="space-y-1">
                        <div className="p-2 rounded bg-white/[0.04] text-white flex justify-between cursor-pointer">
                          <span>Overview</span>
                          <span className="text-emerald-400">Open</span>
                        </div>
                        <div className="p-2 rounded hover:bg-white/[0.02] text-zinc-400 flex justify-between cursor-pointer">
                          <span>Security blast radius</span>
                          <span className="text-zinc-400">2 svcs</span>
                        </div>
                        <div className="p-2 rounded hover:bg-white/[0.02] text-zinc-400 cursor-pointer">
                          <span>Architecture impact</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                        <div className="text-[10px] text-zinc-400 uppercase">Impact Stack</div>
                        <div className="p-2 rounded bg-[#0e0e14] border border-white/[0.04] space-y-0.5">
                          <span className="text-zinc-200 font-medium">1. Invitation data model</span>
                          <div className="text-[10px] text-zinc-400">2 files touched</div>
                        </div>
                        <div className="p-2 rounded bg-[#0e0e14] border border-white/[0.04] space-y-0.5">
                          <span className="text-zinc-200 font-medium">2. API and email router</span>
                          <div className="text-[10px] text-zinc-400">3 files touched</div>
                        </div>
                      </div>
                    </div>

                    {/* Right Diff Pane */}
                    <div className="md:col-span-8 rounded-lg border border-white/[0.06] bg-[#09090c] p-3 space-y-2.5 font-mono text-[11px]">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-zinc-300">
                        <span className="font-semibold text-white">src/server/auth/permissions.ts</span>
                        <span className="text-zinc-400">-3 +11</span>
                      </div>

                      <div className="space-y-1 text-zinc-400 leading-relaxed overflow-hidden text-[10.5px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <div className="text-zinc-500">21   return member.role === "ADMIN";</div>
                        <div className="text-zinc-500">22 &#125;</div>
                        <div className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded -mx-1 truncate">
                          + export function canInviteMembers(member: Member): boolean &#123;
                        </div>
                        <div className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded -mx-1 truncate">
                          +   return member.role === "ADMIN" || member.isOrgOwner;
                        </div>
                        <div className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded -mx-1">
                          + &#125;
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/[0.06] text-[10px] text-zinc-400 flex items-center justify-between">
                        <span>Restricts token generation to org admins</span>
                        <span className="text-emerald-400">No regressions</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------------
                CARD 04: SECURE & REAL-TIME CODEBASE HEALTH
                ------------------------------------------------------------- */}
            <div
              onMouseEnter={() => setActiveCard(3)}
              onClick={() => setActiveCard(3)}
              className={`transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col relative overflow-hidden ${
                activeCard === 3
                  ? "lg:flex-[4] bg-[#0c0c10] opacity-100 z-10"
                  : "lg:flex-[0.8] bg-[#08080b] opacity-45 hover:opacity-80 cursor-pointer cursor-target"
              }`}
            >
              {/* Dimmed overlay when collapsed */}
              {activeCard !== 3 && (
                <div className="absolute inset-0 bg-[#08080b]/50 z-20 pointer-events-none transition-opacity" />
              )}

              {/* Card Header Tab */}
              <div className="h-12 border-b border-white/[0.08] px-4 sm:px-5 flex items-center justify-between bg-[#09090d] shrink-0 z-30">
                <div className="flex items-center gap-2 text-xs font-mono font-medium truncate">
                  <span className={activeCard === 3 ? "text-emerald-400 font-bold" : "text-zinc-500"}>04</span>
                  <span className={activeCard === 3 ? "text-white font-semibold" : "text-zinc-400"}>
                    Secure
                  </span>
                  {activeCard === 3 && (
                    <span className="hidden sm:inline text-zinc-400 font-normal">
                      and monitor codebase health
                    </span>
                  )}
                </div>
                {activeCard === 3 && (
                  <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                    Real-time
                  </span>
                )}
              </div>

              {/* Card Body: Health Score & Security Findings */}
              <div
                className={`p-4 sm:p-6 flex-1 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                  activeCard === 3 ? "overflow-y-auto" : "overflow-hidden pointer-events-none select-none"
                }`}
              >
                <div className="space-y-4 min-w-[460px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                        REAL-TIME CODEBASE HEALTH
                      </span>
                      <div className="text-2xl font-bold text-white tracking-tight">Mostly healthy</div>
                    </div>
                    <div className="text-right text-[11px] font-mono text-zinc-400">
                      <div>Scanning every PR</div>
                      <div className="text-emerald-400">Last scan 12s ago</div>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden flex">
                    <div className="h-full bg-emerald-400 w-[84%]" title="Healthy (84%)" />
                    <div className="h-full bg-amber-400 w-[12%]" title="Warnings (12%)" />
                    <div className="h-full bg-rose-400 w-[4%]" title="High Risk (4%)" />
                  </div>

                  {/* Vulnerability & Blocker Card */}
                  <div className="rounded-lg border border-white/[0.08] bg-[#09090c] p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-400" /> Dependency Vulnerability
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300">
                        High Severity
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="font-mono text-white font-semibold">axios · GHSA-4w2v-q235-vp99</div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Detected on PR #482 (gitinsight/auth-module). Allows server-side request forgery in edge middleware.
                      </p>
                    </div>

                    <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/20 text-xs font-mono text-emerald-400 flex items-center justify-between">
                      <span>Fix ready: Upgrade axios to &gt;= 1.7.4</span>
                      <button className="px-2.5 py-1 rounded bg-white text-zinc-950 font-semibold text-[10px] hover:bg-zinc-200 transition-colors cursor-target">
                        Create Fix PR
                      </button>
                    </div>
                  </div>

                  {/* Micro Heatmap */}
                  <div className="p-3 rounded-lg border border-white/[0.05] bg-[#09090c] space-y-2">
                    <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                      <span>Repository Activity Rhythm</span>
                      <span className="text-emerald-400">0 Critical Breaches</span>
                    </div>
                    <div className="grid grid-cols-20 gap-1">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2.5 rounded-xs ${
                            i % 5 === 0 ? "bg-emerald-400" : i % 3 === 0 ? "bg-emerald-700" : "bg-zinc-800"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Right Control: Auto-play Pause / Play Button */}
          <div className="absolute bottom-3 right-3 z-30">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-7 h-7 rounded-md bg-[#09090d]/90 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer cursor-target shadow-md"
              title={isPaused ? "Resume auto-play" : "Pause auto-play"}
            >
              {isPaused ? <Play className="w-3 h-3 text-zinc-300" /> : <Pause className="w-3 h-3 text-zinc-300" />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
