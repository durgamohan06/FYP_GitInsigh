import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, Button } from "@/components/ui-bits";
import { Mic, Volume2, Sparkles, Send } from "lucide-react";

export const Route = createFileRoute("/voice")({
  head: () => ({ meta: [{ title: "Voice Assistant · GitInsight AI" }] }),
  component: VoicePage,
});

const suggestions = [
  "What was completed today?",
  "Which pull requests are pending?",
  "Who is working on Authentication?",
  "Show inactive contributors.",
  "Which module has blockers?",
];

type Msg = { role: "user" | "assistant"; text: string };

function VoicePage() {
  const [listening, setListening] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Hi Durga — ask me anything about your projects. I've reviewed today's activity across 12 repositories.",
    },
  ]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const reply =
      "Based on today's activity: 22 commits merged, 4 PRs opened, and 3 blockers detected. Voice Assistant repo needs immediate attention.";
    setMsgs((m) => [...m, { role: "user", text }, { role: "assistant", text: reply }]);
    setInput("");
  };

  return (
    <AppShell>
      <PageHeader title="Voice Assistant" subtitle="Ask GitInsight AI. Voice or text." />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-8 lg:col-span-2 flex flex-col items-center text-center">
          <div className="relative">
            {listening && (
              <>
                <span className="absolute inset-0 rounded-full bg-brand/40 animate-pulse-ring" />
                <span
                  className="absolute inset-0 rounded-full bg-brand-2/30 animate-pulse-ring"
                  style={{ animationDelay: "0.4s" }}
                />
              </>
            )}
            <button
              onClick={() => setListening((v) => !v)}
              className="relative h-40 w-40 rounded-full bg-brand-gradient text-white grid place-items-center shadow-2xl shadow-brand/40 hover:scale-105 transition"
            >
              <Mic className="h-16 w-16" />
            </button>
          </div>
          <div className="mt-6 font-semibold">{listening ? "Listening…" : "Tap to speak"}</div>
          <div className="text-xs text-muted-foreground mt-1">GitInsight AI · voice mode</div>

          {listening && (
            <div className="mt-6 flex items-end gap-1 h-12">
              {Array.from({ length: 22 }).map((_, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-brand-gradient"
                  style={{
                    animation: `pulse 0.9s ease-in-out ${i * 0.05}s infinite alternate`,
                    height: `${20 + Math.random() * 80}%`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="mt-8 w-full">
            <div className="text-xs text-muted-foreground mb-2 text-left">Quick suggestions</div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-0 lg:col-span-3 flex flex-col overflow-hidden" lift={false}>
          <div className="p-4 border-b border-border flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-gradient grid place-items-center text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">GitInsight AI</div>
              <div className="text-[11px] text-muted-foreground">Conversation · today</div>
            </div>
          </div>
          <div className="flex-1 p-4 space-y-4 min-h-[420px] max-h-[520px] overflow-y-auto">
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`h-8 w-8 rounded-full shrink-0 grid place-items-center text-xs font-semibold ${
                    m.role === "user" ? "bg-muted" : "bg-brand-gradient text-white"
                  }`}
                >
                  {m.role === "user" ? "DR" : <Sparkles className="h-4 w-4" />}
                </div>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm max-w-[75%] ${
                    m.role === "user" ? "bg-brand-gradient text-white" : "bg-muted"
                  }`}
                >
                  {m.text}
                  {m.role === "assistant" && (
                    <button className="ml-2 inline-flex items-center gap-1 text-[11px] opacity-70 hover:opacity-100">
                      <Volume2 className="h-3 w-3" /> Play
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Ask GitInsight AI…"
              className="flex-1 h-11 px-4 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
            <Button onClick={() => send(input)}>
              <Send className="h-4 w-4" /> Send
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
