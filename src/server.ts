import { handleRepositoryManagement } from "./lib/repository-management";
import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

import { handleGetRepos } from "./lib/github-api";
import { handleGetDashboard } from "./lib/dashboard-api";
import { handleGetRepoInsights } from "./lib/repo-insights";
import { handleGetRepoDetail } from "./lib/repo-detail-api";
import { handleGetTeamAnalytics } from "./lib/github-team-analytics-api";
import { handleGetTeamProjects } from "./lib/github-team-projects-api";
import { handleGetGlobalSearch, handleGetNotifications } from "./lib/github-global-api";
import {
  handleGitHubLogin,
  handleGitHubCallback,
  handleGetUser,
  handleLogout,
} from "./lib/github-oauth";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      if (url.pathname === "/api/manage-repository")
        return await handleRepositoryManagement(request);

      if (url.pathname === "/api/repos/detail") {
        return await handleGetRepoDetail(request);
      }
      if (url.pathname === "/api/repos/insights") {
        return await handleGetRepoInsights(request);
      }
      if (url.pathname === "/api/dashboard") {
        return await handleGetDashboard(request);
      }
      if (url.pathname === "/api/team/analytics") {
        return await handleGetTeamAnalytics(request);
      }
      if (url.pathname === "/api/team/projects") {
        return await handleGetTeamProjects(request);
      }
      if (url.pathname === "/api/search") {
        return await handleGetGlobalSearch(request);
      }
      if (url.pathname === "/api/notifications") {
        return await handleGetNotifications(request);
      }
      if (url.pathname === "/api/repos") {
        return await handleGetRepos(request);
      }
      if (url.pathname === "/api/auth/github") {
        return handleGitHubLogin(request);
      }
      if (url.pathname === "/api/auth/github/callback") {
        return await handleGitHubCallback(request);
      }
      if (url.pathname === "/api/auth/user") {
        return await handleGetUser(request);
      }
      if (url.pathname === "/api/auth/logout") {
        return handleLogout();
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
