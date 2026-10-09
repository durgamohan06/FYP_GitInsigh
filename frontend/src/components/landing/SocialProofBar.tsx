import React from "react";
import { Github } from "lucide-react";

// Company SVG Icons matching user's reference image
function LinearIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm-1.8 14.5a1.2 1.2 0 0 1-1.7-1.7l5.5-5.5a1.2 1.2 0 0 1 1.7 1.7Z" />
    </svg>
  );
}

function SlackIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

function TwitchIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
    </svg>
  );
}

function VercelIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 22.525H0l12-21.05 12 21.05z" />
    </svg>
  );
}

function AtlassianIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.528 1.488a.952.952 0 0 0-1.056.24L4.74 8.28a.952.952 0 0 0 .288 1.512c3.48 1.464 6.72 4.104 8.76 7.416a.952.952 0 0 0 1.632-.984C13.2 12.336 11.784 6.504 11.528 1.488ZM12.472 22.512a.952.952 0 0 0 1.056-.24l5.736-6.552a.952.952 0 0 0-.288-1.512c-3.48-1.464-6.72-4.104-8.76-7.416a.952.952 0 0 0-1.632.984c2.22 3.888 3.636 9.72 3.888 14.736Z" />
    </svg>
  );
}

const COMPANIES = [
  { name: "Linear", icon: LinearIcon },
  { name: "Slack", icon: SlackIcon },
  { name: "GitHub", icon: Github },
  { name: "Twitch", icon: TwitchIcon },
  { name: "Vercel", icon: VercelIcon },
  { name: "Atlassian", icon: AtlassianIcon },
];

export function SocialProofBar() {
  // Bar chart configurations matching the reference image
  const commitsBars = [
    { height: 75, isProminent: false },
    { height: 60, isProminent: true },
    { height: 35, isProminent: false },
    { height: 70, isProminent: true },
    { height: 58, isProminent: false },
    { height: 50, isProminent: true },
    { height: 30, isProminent: true },
    { height: 68, isProminent: true },
  ];

  const prsBars = [
    { height: 65, isProminent: true },
    { height: 30, isProminent: false },
    { height: 48, isProminent: true },
    { height: 35, isProminent: false },
    { height: 52, isProminent: true },
    { height: 62, isProminent: false },
    { height: 82, isProminent: true },
    { height: 88, isProminent: false },
  ];

  const devActivityBars = [
    { height: 30, isProminent: false },
    { height: 48, isProminent: true },
    { height: 62, isProminent: false },
    { height: 68, isProminent: false },
    { height: 54, isProminent: true },
    { height: 32, isProminent: true },
    { height: 55, isProminent: false },
    { height: 62, isProminent: true },
    { height: 38, isProminent: false },
    { height: 76, isProminent: true },
    { height: 84, isProminent: false },
    { height: 74, isProminent: true },
    { height: 42, isProminent: false },
    { height: 92, isProminent: true },
    { height: 80, isProminent: true },
    { height: 86, isProminent: false },
    { height: 68, isProminent: true },
    { height: 78, isProminent: true },
  ];

  return (
    <section className="py-16 md:py-20 border-y border-white/[0.07] bg-[#07070a] text-zinc-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* =========================================================================
            Dark-Themed Repository Activity Dashboard (Replaces engineered for modern stack)
            Matches user's reference image with animated fluctuating bars
            ========================================================================= */}
        <div className="mb-14 max-w-5xl mx-auto rounded-2xl border border-white/[0.1] bg-[#0a0a0f] p-5 sm:p-7 lg:p-8 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95),0_0_60px_rgba(0,0,0,0.85)] relative overflow-hidden">
          {/* Subtle inner top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-white/[0.02] blur-2xl pointer-events-none" />

          {/* Top Bar matching image: Circle avatar, skeleton pills, search button pill */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-zinc-400" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="h-2.5 w-24 sm:w-32 bg-zinc-700/80 rounded-full" />
                <div className="h-2 w-14 sm:w-18 bg-zinc-800/80 rounded-full" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-2 w-12 sm:w-16 bg-zinc-800/70 rounded-full hidden sm:block" />
              <div className="h-6 px-3 bg-zinc-900 border border-white/10 rounded-md flex items-center justify-center shadow-inner">
                <div className="h-1.5 w-6 bg-zinc-600 rounded-full" />
              </div>
            </div>
          </div>

          {/* Main Grid: Row 1 has 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-4 sm:mb-5">
            {/* CARD 1: 847 Total Commits with 8 Animated Bars */}
            <div className="bg-[#0f0f15] border border-white/[0.06] hover:border-white/[0.12] transition-colors rounded-xl p-5 flex flex-col justify-between h-[180px]">
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">847</div>
                <div className="text-xs text-zinc-400 font-medium mt-0.5">Total Commits</div>
              </div>

              {/* 8 animated slender vertical bars */}
              <div className="h-[82px] flex items-end justify-between gap-2 px-1">
                {commitsBars.map((bar, i) => (
                  <div
                    key={i}
                    className={`flex-1 max-w-[14px] rounded-t-sm ${
                      bar.isProminent ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.15)]" : "bg-zinc-800"
                    } ${i % 2 === 0 ? "animate-bar-fluctuate" : "animate-bar-fluctuate-alt"}`}
                    style={{
                      height: `${bar.height}%`,
                      ["--bar-delay" as any]: `${(i * 0.16).toFixed(2)}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* CARD 2: 23 Open PRs with 8 Animated Bars */}
            <div className="bg-[#0f0f15] border border-white/[0.06] hover:border-white/[0.12] transition-colors rounded-xl p-5 flex flex-col justify-between h-[180px]">
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">23</div>
                <div className="text-xs text-zinc-400 font-medium mt-0.5">Open PRs</div>
              </div>

              {/* 8 animated slender vertical bars */}
              <div className="h-[82px] flex items-end justify-between gap-2 px-1">
                {prsBars.map((bar, i) => (
                  <div
                    key={i}
                    className={`flex-1 max-w-[14px] rounded-t-sm ${
                      bar.isProminent ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.15)]" : "bg-zinc-800"
                    } ${i % 2 === 1 ? "animate-bar-fluctuate" : "animate-bar-fluctuate-alt"}`}
                    style={{
                      height: `${bar.height}%`,
                      ["--bar-delay" as any]: `${((7 - i) * 0.18).toFixed(2)}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* CARD 3: 12 Active Repos with Status Indicators */}
            <div className="bg-[#0f0f15] border border-white/[0.06] hover:border-white/[0.12] transition-colors rounded-xl p-5 flex flex-col justify-between h-[180px]">
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">12</div>
                <div className="text-xs text-zinc-400 font-medium mt-0.5">Active Repos</div>
              </div>

              {/* 3 Status Rows matching reference */}
              <div className="flex flex-col gap-3 pb-1">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
                  <div className="h-2 w-full bg-zinc-800/90 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-zinc-500 shrink-0" />
                  <div className="h-2 w-3/4 bg-zinc-800/70 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                  <div className="h-2 w-5/6 bg-zinc-800/80 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Bottom Wide Card (2 cols) + Bottom Right Card (1 col) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {/* CARD 4: Development Activity — Last 30 Days (2 columns wide) */}
            <div className="md:col-span-2 bg-[#0f0f15] border border-white/[0.06] hover:border-white/[0.12] transition-colors rounded-xl p-5 flex flex-col justify-between h-[175px]">
              <div className="text-xs text-zinc-400 font-medium tracking-wide">
                Development Activity — Last 30 Days
              </div>

              {/* 18 animated slender vertical bars */}
              <div className="h-[84px] flex items-end justify-between gap-1.5 sm:gap-2 px-1">
                {devActivityBars.map((bar, i) => (
                  <div
                    key={i}
                    className={`flex-1 max-w-[12px] rounded-t-sm ${
                      bar.isProminent ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.12)]" : "bg-zinc-800"
                    } ${i % 3 === 0 ? "animate-bar-fluctuate" : "animate-bar-fluctuate-alt"}`}
                    style={{
                      height: `${bar.height}%`,
                      ["--bar-delay" as any]: `${((i * 0.12) % 2.0).toFixed(2)}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* CARD 5: 56 Open Issues with Status Indicators */}
            <div className="md:col-span-1 bg-[#0f0f15] border border-white/[0.06] hover:border-white/[0.12] transition-colors rounded-xl p-5 flex flex-col justify-between h-[175px]">
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">56</div>
                <div className="text-xs text-zinc-400 font-medium mt-0.5">Open Issues</div>
              </div>

              {/* 2 Status Rows matching reference */}
              <div className="flex flex-col gap-3 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                  <div className="h-2 w-4/5 bg-zinc-800/90 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
                  <div className="h-2 w-full bg-zinc-800/80 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            Continuous Moving Company Logo Marquee (Replaces stats and quote)
            Matches user's reference image with seamless loop and gradient mask
            ========================================================================= */}
        <div className="pt-4 sm:pt-6">
          <div className="text-center mb-8">
            <span className="text-xs sm:text-sm font-normal text-zinc-400 tracking-normal">
              Built for teams building with GitHub.
            </span>
          </div>

          {/* Marquee Carousel Container with Gradient Edge Masks */}
          <div className="relative overflow-hidden w-full py-2">
            {/* Left & Right fade masks */}
            <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-36 bg-gradient-to-r from-[#07070a] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-36 bg-gradient-to-l from-[#07070a] to-transparent z-10 pointer-events-none" />

            {/* Seamless continuously moving track */}
            <div className="animate-continuous-marquee flex items-center gap-12 sm:gap-16 lg:gap-20">
              {[...COMPANIES, ...COMPANIES, ...COMPANIES, ...COMPANIES].map((company, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 sm:gap-3 text-zinc-300 hover:text-white transition-colors cursor-pointer select-none group shrink-0"
                >
                  <div className="w-5 h-5 flex items-center justify-center text-zinc-300 group-hover:text-white transition-colors">
                    <company.icon className="w-4 h-4 fill-current" />
                  </div>
                  <span className="font-semibold text-sm sm:text-[15px] tracking-tight text-zinc-200 group-hover:text-white transition-colors">
                    {company.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
