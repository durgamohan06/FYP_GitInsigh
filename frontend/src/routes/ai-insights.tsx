import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, Badge, Button } from "@/components/ui-bits";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Clock, Target } from "lucide-react";

export const Route = createFileRoute("/ai-insights")({
  head: () => ({ meta: [{ title: "AI Insights · GitInsight AI" }] }),
  component: AIInsights,
});

const cards = [
  {
    title: "Today's Summary",
    icon: Sparkles,
    tone: "brand",
    body: "22 commits, 4 PRs merged, 3 issues closed. Auth module reached 82% completion.",
  },
  {
    title: "Weekly Summary",
    icon: TrendingUp,
    tone: "cyan",
    body: "Velocity up 14%. Frontend team leads with 62 commits. Backend closed 18 issues.",
  },
  {
    title: "Sprint Summary",
    icon: Target,
    tone: "brand",
    body: "Sprint 24 · 78% of committed points delivered. 3 stories carried over.",
  },
  {
    title: "Risk Analysis",
    icon: AlertTriangle,
    tone: "danger",
    body: "Voice Assistant repo is 43% complete with 2 weeks to freeze. High risk.",
  },
  {
    title: "Prediction",
    icon: TrendingUp,
    tone: "brand",
    body: "On current trajectory, release v2.4 ships on time (92% confidence).",
  },
  {
    title: "Completed Tasks",
    icon: CheckCircle2,
    tone: "success",
    body: "Passkey login · Rate limiting · CI cache · Onboarding checklist.",
  },
  {
    title: "Pending Tasks",
    icon: Clock,
    tone: "warning",
    body: "Session revocation · Audit export · Sentry rollout · Docs refresh.",
  },
  {
    title: "Recommended Actions",
    icon: Sparkles,
    tone: "brand",
    body: "Reassign PR #482 · Split migration into 2 steps · Pair on voice repo.",
  },
];

function AIInsights() {
  return (
    <AppShell>
      <PageHeader
        title="AI Insights"
        subtitle="Everything GitInsight AI has learned from your projects today."
        actions={<Button>Regenerate insights</Button>}
      />

      <Card className="p-6 mb-6 bg-gradient-to-br from-brand/10 via-brand-2/5 to-accent-cyan/10 border-brand/20">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-xl bg-brand-gradient grid place-items-center text-white shadow-lg shadow-brand/25 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold">Executive brief</div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Overall project health is strong at 92%. Two repositories need attention this week:{" "}
              <b>voice-assistant</b> is behind schedule, and
              <b> dashboard-ui</b> has a failing deploy blocking preview. If both are unblocked
              within 48 hours, the v2.4 release remains on track.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title} className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-xl bg-brand/10 text-brand grid place-items-center">
                  <Icon className="h-4 w-4" />
                </div>
                <Badge tone={c.tone as any}>{c.title}</Badge>
              </div>
              <p className="text-sm leading-relaxed">{c.body}</p>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
