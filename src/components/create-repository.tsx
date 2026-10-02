import { useState } from "react";
import { Plus, Users, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui-bits";
import {
  managementRequest,
  managementResult,
  type ManagementResult,
} from "../lib/repository-management-schema";

export function CreateRepository({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"create" | "invite">("create");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setPrivate] = useState(true);
  const [members, setMembers] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ManagementResult | null>(null);
  const field = "w-full rounded-lg border border-border bg-background p-3 text-sm";
  async function submit(retry = false) {
    if (busy) return;
    const usernames =
      retry && result
        ? result.invitations.filter((item) => item.status === "failed").map((item) => item.username)
        : members
            .split(/[\s,;]+/)
            .filter(Boolean)
            .map((item) => item.replace(/^@/, ""));
    const payload = managementRequest.safeParse({
      action: retry ? "invite" : action,
      name: retry && result ? result.repository.name : name,
      description,
      private: isPrivate,
      members: usernames,
    });
    if (!payload.success) {
      setError(payload.error.issues[0]?.message || "Check your details.");
      return;
    }
    if (payload.data.action === "invite" && !usernames.length) {
      setError("Enter at least one team member.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/manage-repository", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.data),
      });
      const body: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof body.message === "string"
            ? body.message
            : "Could not complete this action.",
        );
      const updated = managementResult.parse(body);
      setResult(
        retry && result
          ? {
              ...updated,
              invitations: result.invitations.map(
                (item) =>
                  updated.invitations.find((next) => next.username === item.username) || item,
              ),
            }
          : updated,
      );
      onCreated();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not confirm the result. Check your repositories before trying again.",
      );
    } finally {
      setBusy(false);
    }
  }
  function reset() {
    setResult(null);
    setName("");
    setDescription("");
    setMembers("");
    setPrivate(true);
    setError("");
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Create repository
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{result ? "Repository ready" : "Set up your team’s repository"}</DialogTitle>
          <DialogDescription>
            Repositories are owned by your signed-in GitHub account. Collaborators receive GitHub
            invitations and must accept to join.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm"
          >
            {error}
          </p>
        )}
        {result ? (
          <div className="space-y-4" aria-live="polite">
            <a
              href={result.repository.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-semibold text-brand underline"
            >
              {result.repository.fullName} ↗
            </a>
            <p className="text-sm text-muted-foreground">
              {result.invitations.filter((item) => item.status === "invited").length} invitations
              pending · {result.invitations.filter((item) => item.status === "member").length}{" "}
              already have access ·{" "}
              {result.invitations.filter((item) => item.status === "failed").length} failed
            </p>
            <ul className="space-y-2">
              {result.invitations.map((item) => (
                <li key={item.username} className="rounded-lg border border-border p-3 text-sm">
                  <strong>@{item.username}</strong>
                  <span
                    className={`mt-1 block ${item.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {item.message}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              {result.invitations.some((item) => item.status === "failed") && (
                <Button disabled={busy} onClick={() => void submit(true)}>
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                  Retry failed invitations
                </Button>
              )}
              <Button variant="secondary" disabled={busy} onClick={() => setOpen(false)}>
                Done
              </Button>
              <Button variant="secondary" disabled={busy} onClick={reset}>
                Start another
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <fieldset disabled={busy} className="space-y-4">
              <label className="block space-y-1 text-sm">
                <span>Action</span>
                <select
                  className={field}
                  value={action}
                  onChange={(event) =>
                    setAction(event.target.value === "invite" ? "invite" : "create")
                  }
                >
                  <option value="create">Create a new repository</option>
                  <option value="invite">Invite members to an existing repository I own</option>
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span>Repository name</span>
                <input
                  className={field}
                  required
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="team-project"
                />
              </label>
              {action === "create" && (
                <>
                  <label className="block space-y-1 text-sm">
                    <span>Description (optional)</span>
                    <textarea
                      className={field}
                      maxLength={350}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                    />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span>Visibility</span>
                    <select
                      className={field}
                      value={isPrivate ? "private" : "public"}
                      onChange={(event) => setPrivate(event.target.value === "private")}
                    >
                      <option value="private">Private — only you and your collaborators</option>
                      <option value="public">Public — anyone can view the repository</option>
                    </select>
                  </label>
                </>
              )}
              <label className="block space-y-1 text-sm">
                <span>Team members’ GitHub usernames</span>
                <textarea
                  className={field}
                  rows={3}
                  value={members}
                  onChange={(event) => setMembers(event.target.value)}
                  placeholder="octocat, teammate"
                  aria-describedby="member-help"
                />
              </label>
              <p id="member-help" className="text-xs text-muted-foreground">
                Separate usernames with commas or new lines. Up to 20 per submission. Members get
                write access; you remain the owner. Email addresses are not supported.
              </p>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {busy ? "Working…" : action === "create" ? "Create & invite" : "Send invitations"}
              </Button>
            </fieldset>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
