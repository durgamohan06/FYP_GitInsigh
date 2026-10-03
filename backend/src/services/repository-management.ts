import type { IncomingMessage, ServerResponse } from "node:http";
import type { TLSSocket } from "node:tls";
import { z } from "zod";
import { getCookieValue } from "./github-oauth.js";
import { managementRequest, type ManagementResult } from "./repository-management-schema.js";

const profileSchema = z.object({ login: z.string() });
const repoSchema = z.object({
  name: z.string(),
  full_name: z.string(),
  html_url: z.string().url(),
  owner: z.object({ login: z.string() }),
});
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const failure = (message: string, status: number) => json({ message }, status);
function githubMessage(status: number): string {
  if (status === 401) return "Your GitHub session expired. Please sign in again.";
  if (status === 403 || status === 429)
    return "GitHub denied this action or its rate limit was reached. Check your permissions and try again later.";
  if (status === 404) return "The repository or GitHub username could not be found.";
  if (status === 422)
    return "GitHub could not accept this request. Check the name, existing invitations, and account restrictions.";
  return "GitHub could not complete this action. Try again later.";
}

export async function handleRepositoryManagement(request: Request): Promise<Response> {
  if (request.method !== "POST")
    return new Response(null, { status: 405, headers: { Allow: "POST" } });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return failure("This action must be submitted from this app.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return failure("Send a JSON request.", 415);
  // Never use the shared server PAT for manager mutations.
  const token = getCookieValue(request.headers.get("cookie"), "github_token");
  if (!token) return failure("Sign in with GitHub before creating a repository.", 401);
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 16384) return failure("The request is too large.", 413);
    body = JSON.parse(text);
  } catch {
    return failure("The request was not valid JSON.", 400);
  }
  const input = managementRequest.safeParse(body);
  if (!input.success)
    return failure(input.error.issues[0]?.message || "Check your repository details.", 400);
  const api = (path: string, method = "GET", payload?: unknown) =>
    fetch(`https://api.github.com${path}`, {
      method,
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "GitInsight-AI",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    });
  try {
    const userResponse = await api("/user");
    if (!userResponse.ok)
      return failure(githubMessage(userResponse.status), userResponse.status === 401 ? 401 : 502);
    const user = profileSchema.parse(await userResponse.json());
    const data = input.data;
    if (data.members.includes(user.login.toLowerCase()))
      return failure(
        "You already own this repository. Remove your username from the collaborator list.",
        400,
      );
    const repoResponse =
      data.action === "create"
        ? await api("/user/repos", "POST", {
            name: data.name,
            description: data.description,
            private: data.private,
            auto_init: true,
          })
        : await api(`/repos/${encodeURIComponent(user.login)}/${encodeURIComponent(data.name)}`);
    if (!repoResponse.ok)
      return failure(
        data.action === "create" && repoResponse.status === 422
          ? "GitHub could not create this repository. The name may already exist on your account; check your repositories before trying again."
          : githubMessage(repoResponse.status),
        repoResponse.status === 422 ? 409 : 502,
      );
    const repo = repoSchema.parse(await repoResponse.json());
    if (repo.owner.login.toLowerCase() !== user.login.toLowerCase())
      return failure("Only the repository owner can invite members here.", 403);
    const invitations: ManagementResult["invitations"] = [];
    for (const username of data.members) {
      try {
        const response = await api(
          `/repos/${encodeURIComponent(user.login)}/${encodeURIComponent(repo.name)}/collaborators/${encodeURIComponent(username)}`,
          "PUT",
          { permission: "push" },
        );
        const status =
          response.status === 201 ? "invited" : response.status === 204 ? "member" : "failed";
        invitations.push({
          username,
          status,
          message:
            status === "invited"
              ? "Invitation pending acceptance"
              : status === "member"
                ? "Already has access"
                : githubMessage(response.status),
        });
      } catch {
        invitations.push({
          username,
          status: "failed",
          message: "Could not confirm this invitation. Retry to check or resend it.",
        });
      }
    }
    return json(
      {
        repository: {
          name: repo.name,
          fullName: repo.full_name,
          url: `https://github.com/${encodeURIComponent(repo.owner.login)}/${encodeURIComponent(repo.name)}`,
        },
        invitations,
      } satisfies ManagementResult,
      data.action === "create" ? 201 : 200,
    );
  } catch {
    return failure(
      "Could not confirm the result with GitHub. Check your repository list before creating again. If the repository exists, use Invite members to finish setup.",
      502,
    );
  }
}

export async function nodeRepositoryManagement(
  req: IncomingMessage & { originalUrl?: string },
  res: ServerResponse,
): Promise<void> {
  try {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += bytes.length;
      if (size > 16384) {
        res.statusCode = 413;
        res.end("Request too large");
        return;
      }
      chunks.push(bytes);
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers))
      if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    const protocol = (req.socket as TLSSocket).encrypted ? "https" : "http";
    const method = req.method || "GET";
    const response = await handleRepositoryManagement(
      new Request(
        `${protocol}://${req.headers.host || "localhost:8080"}${req.originalUrl || req.url}`,
        {
          method,
          headers,
          ...(method === "GET" || method === "HEAD"
            ? {}
            : { body: Buffer.concat(chunks).toString("utf8") }),
        },
      ),
    );
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(await response.text());
  } catch {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Unable to process this request. Please try again." }));
  }
}
