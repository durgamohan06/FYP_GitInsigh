import React from "react";
import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="relative bg-[#050507] text-zinc-400 pt-20 pb-0 overflow-hidden border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-20 text-xs">
          {/* Col 1: Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold text-sm cursor-target">
              <div className="w-5 h-5 rounded bg-zinc-900 border border-white/20 flex items-center justify-center text-white">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="12" r="3" />
                  <path d="M6 9v6" />
                  <path d="M9 15l6-3" />
                </svg>
              </div>
              <span>GitInsight</span>
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed max-w-xs">
              AI-powered GitHub repository telemetry & project intelligence for modern engineering teams.
            </p>
          </div>

          {/* Col 2: Product */}
          <div className="space-y-3">
            <div className="font-semibold text-zinc-200">Product</div>
            <ul className="space-y-2 text-zinc-500">
              <li><a href="#overview" className="hover:text-white transition-colors cursor-target">Overview</a></li>
              <li><a href="#code-review" className="hover:text-white transition-colors cursor-target">AI Code Review</a></li>
              <li><a href="#triage" className="hover:text-white transition-colors cursor-target">PR Triage</a></li>
              <li><a href="#project-health" className="hover:text-white transition-colors cursor-target">Project Health</a></li>
              <li><a href="#context" className="hover:text-white transition-colors cursor-target">Knowledge Graph</a></li>
            </ul>
          </div>

          {/* Col 3: Platform */}
          <div className="space-y-3">
            <div className="font-semibold text-zinc-200">Platform</div>
            <ul className="space-y-2 text-zinc-500">
              <li><a href="#" className="hover:text-white transition-colors cursor-target">GitHub App</a></li>
              <li><a href="#" className="hover:text-white transition-colors cursor-target">Slack Integration</a></li>
              <li><a href="#" className="hover:text-white transition-colors cursor-target">CLI & Webhooks</a></li>
              <li><a href="#" className="hover:text-white transition-colors cursor-target">System Status</a></li>
              <li><a href="#" className="hover:text-white transition-colors cursor-target">Security & SOC2</a></li>
            </ul>
          </div>

          {/* Col 4: Resources */}
          <div className="space-y-3">
            <div className="font-semibold text-zinc-200">Resources</div>
            <ul className="space-y-2 text-zinc-500">
              <li><a href="#" className="hover:text-white transition-colors cursor-target">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors cursor-target">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition-colors cursor-target">Changelog</a></li>
              <li><a href="#" className="hover:text-white transition-colors cursor-target">Engineering Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors cursor-target">Open Source</a></li>
            </ul>
          </div>

          {/* Col 5: Company */}
          <div className="space-y-3">
            <div className="font-semibold text-zinc-200">Company</div>
            <ul className="space-y-2 text-zinc-500">
              <li><a href="#" className="hover:text-white transition-colors cursor-target">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors cursor-target">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors cursor-target">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors cursor-target">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors cursor-target">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 font-mono">
          <div>© 2026 GitInsight AI, Inc. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors cursor-target">Privacy</a>
            <a href="#" className="hover:text-white transition-colors cursor-target">Terms</a>
            <a href="#" className="hover:text-white transition-colors cursor-target">Security</a>
          </div>
        </div>
      </div>

      {/* Giant Gradient Outline Wordmark (Matching CodeRabbit reference) */}
      <div className="w-full relative mt-16 sm:mt-20 overflow-hidden select-none leading-none group cursor-default">
        {/* Subtle ambient warm horizon glow with interactive hover intensity */}
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-4/5 max-w-5xl h-36 bg-[radial-gradient(ellipse_at_center,rgba(255,107,43,0.14),rgba(234,88,12,0.03)_55%,transparent_75%)] blur-3xl pointer-events-none transition-opacity duration-700 group-hover:opacity-100 opacity-80" 
          aria-hidden="true"
        />

        <div className="w-full px-2 sm:px-6 md:px-8 max-w-[1750px] mx-auto">
          <svg
            viewBox="0 0 1600 270"
            className="w-full h-auto block transition-all duration-700 ease-out group-hover:drop-shadow-[0_0_20px_rgba(249,115,22,0.2)]"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="footerGitInsightOutline" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#ff6525" stopOpacity="1" />
                <stop offset="22%" stopColor="#f97316" stopOpacity="0.9" />
                <stop offset="45%" stopColor="#ea580c" stopOpacity="0.65" />
                <stop offset="68%" stopColor="#c2410c" stopOpacity="0.32" />
                <stop offset="85%" stopColor="#7c2d12" stopOpacity="0.1" />
                <stop offset="96%" stopColor="#000000" stopOpacity="0.0" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
              </linearGradient>

              {/* Hover intensified gradient */}
              <linearGradient id="footerGitInsightOutlineHover" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#ff7a1a" stopOpacity="1" />
                <stop offset="25%" stopColor="#ff6525" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#ea580c" stopOpacity="0.75" />
                <stop offset="72%" stopColor="#c2410c" stopOpacity="0.45" />
                <stop offset="90%" stopColor="#7c2d12" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Sharp gradient stroke text - hollow vector outline matching CodeRabbit footer */}
            <text
              x="50%"
              y="78%"
              textAnchor="middle"
              fill="none"
              stroke="url(#footerGitInsightOutline)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              className="transition-all duration-700 ease-out group-hover:stroke-[url(#footerGitInsightOutlineHover)]"
              style={{
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                fontSize: "240px",
              }}
            >
              GitInsight
            </text>
          </svg>
        </div>
      </div>
    </footer>
  );
}
