import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Github, Sparkles, ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GitInsight AI — AI-Powered GitHub Project Intelligence" },
      {
        name: "description",
        content:
          "Monitor software projects intelligently. AI-powered GitHub dashboards for engineering leaders and project managers.",
      },
      { property: "og:title", content: "GitInsight AI" },
      { property: "og:description", content: "Track software projects intelligently with AI." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [loggingIn, setLoggingIn] = useState(false);

  const handleGitHubLogin = () => {
    setLoggingIn(true);
    window.location.href = "/api/auth/github";
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background grid place-items-center px-4">
      {/* Animated gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-brand/40 blur-3xl animate-blob" />
        <div
          className="absolute top-1/3 -right-32 h-[480px] w-[480px] rounded-full bg-brand-2/40 blur-3xl animate-blob"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute -bottom-40 left-1/3 h-[520px] w-[520px] rounded-full bg-accent-cyan/30 blur-3xl animate-blob"
          style={{ animationDelay: "6s" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl shadow-brand/10">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-brand-gradient grid place-items-center text-white shadow-xl shadow-brand/30">
              <Sparkles className="h-8 w-8" />
            </div>
            <h1 className="mt-6 text-2xl md:text-3xl font-semibold tracking-tight">
              <span className="text-brand-gradient">GitInsight AI</span>
            </h1>
            <p className="mt-3 text-base font-medium">
              AI-Powered GitHub Project Intelligence Dashboard
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Track software projects intelligently with AI.
            </p>

            <button
              onClick={handleGitHubLogin}
              disabled={loggingIn}
              className="mt-8 w-full h-11 rounded-xl bg-foreground text-background font-medium inline-flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-75 cursor-pointer"
            >
              {loggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Connecting to GitHub…
                </>
              ) : (
                <>
                  <Github className="h-5 w-5" />
                  Continue with GitHub
                </>
              )}
            </button>

            <Link
              to="/dashboard"
              className="mt-3 w-full h-11 rounded-xl border border-border bg-card font-medium inline-flex items-center justify-center gap-2 hover:bg-accent transition"
            >
              Demo Dashboard <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="mt-6 text-xs text-muted-foreground">
              By continuing you agree to our Terms & Privacy Policy.
            </p>
          </div>
        </div>
        <div className="mt-6 text-center text-xs text-muted-foreground">
          Trusted by engineering teams at fast-moving companies.
        </div>
      </div>
    </div>
  );
}
