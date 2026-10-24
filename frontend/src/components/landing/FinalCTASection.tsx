import React from "react";
import { Github, ArrowRight } from "lucide-react";

interface FinalCTASectionProps {
  handleGitHubLogin: () => void;
  loggingIn: boolean;
}

export function FinalCTASection({ handleGitHubLogin, loggingIn }: FinalCTASectionProps) {
  return (
    <section className="py-28 md:py-36 bg-[#060608] text-zinc-100 relative overflow-hidden border-b border-white/[0.07]">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-indigo-500/[0.02] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-4 font-mono">
          Ready to Deploy
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.03em] text-white leading-tight mb-6">
          See what your GitHub activity is really telling you.
        </h2>

        <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed font-normal">
          Turn fragmented pull requests, delayed reviews, and commit noise into actionable engineering intelligence in under 2 minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleGitHubLogin}
            disabled={loggingIn}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-all cursor-pointer shadow-md disabled:opacity-60 cursor-target group"
          >
            <Github className="w-4 h-4 text-zinc-900" />
            <span>{loggingIn ? "Connecting..." : "Get Started with GitHub"}</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={handleGitHubLogin}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 rounded-md text-xs font-medium text-zinc-400 hover:text-white border border-white/[0.08] hover:border-white/[0.2] transition-colors cursor-pointer cursor-target"
          >
            Sign In to Existing Account
          </button>
        </div>
      </div>
    </section>
  );
}
