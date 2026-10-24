import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Github, Menu, X, ArrowRight } from "lucide-react";

interface NavbarProps {
  handleGitHubLogin: () => void;
  loggingIn: boolean;
}

export function Navbar({ handleGitHubLogin, loggingIn }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Overview", href: "#overview" },
    { label: "AI Code Review", href: "#code-review" },
    { label: "PR Triage", href: "#triage" },
    { label: "Project Health", href: "#project-health" },
    { label: "Context Graph", href: "#context" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#060608]/90 backdrop-blur-md border-b border-white/[0.07] transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-6">
          <a href="#" className="flex items-center gap-2.5 group cursor-target">
            <div className="w-6 h-6 rounded bg-zinc-900 border border-white/15 flex items-center justify-center text-white group-hover:border-white/30 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="12" r="3" />
                <path d="M6 9v6" />
                <path d="M9 15l6-3" />
              </svg>
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">GitInsight</span>
          </a>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-5 pl-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[13px] font-medium text-zinc-400 hover:text-zinc-100 transition-colors cursor-target py-1 px-1.5"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={handleGitHubLogin}
            disabled={loggingIn}
            className="text-[13px] font-medium text-zinc-300 hover:text-white px-3 py-1.5 transition-colors cursor-pointer cursor-target"
          >
            Sign In
          </button>
          <button
            onClick={handleGitHubLogin}
            disabled={loggingIn}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-all cursor-pointer shadow-sm disabled:opacity-60 cursor-target group"
          >
            <Github className="w-3.5 h-3.5 text-zinc-900" />
            <span>{loggingIn ? "Connecting..." : "Get Started"}</span>
            <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-zinc-400 hover:text-white p-1 cursor-target"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0a0d] border-b border-white/[0.08] px-6 py-5 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-zinc-300 hover:text-white cursor-target"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
            <button
              onClick={handleGitHubLogin}
              className="text-sm text-zinc-300 hover:text-white cursor-target"
            >
              Sign In
            </button>
            <button
              onClick={handleGitHubLogin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-white text-zinc-950 cursor-target"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Get Started</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
