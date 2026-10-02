import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { TLSSocket } from "node:tls";
import { extractGitHubToken } from "./github-api";
import { getEnv } from "./env";

export interface GitHubUserProfile {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

function oauthHelpPage(options: {
  title: string;
  message: string;
  status?: number;
  showSetup?: boolean;
}): Response {
  const setup = options.showSetup
    ? `<p>To enable GitHub sign-in locally:</p>
    <ol>
      <li>Copy <code>.env.example</code> to <code>.env</code> in the project root.</li>
      <li>Create an OAuth App in <a class="link" href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer">GitHub Developer Settings</a>.</li>
      <li>Set the OAuth App callback URL and <code>GITHUB_CALLBACK_URL</code> to <code>http://localhost:8080/api/auth/github/callback</code> (or your actual local host and port). Use that same host to open the app.</li>
      <li>Add <code>GITHUB_CLIENT_ID</code> and <code>GITHUB_CLIENT_SECRET</code> to <code>.env</code>, replace the example values, then restart the app. Never commit <code>.env</code>.</li>
    </ol><p>Using the deployed app? You do not need a local <code>.env</code>. Please try again later or let the site owner know sign-in is unavailable.</p>`
    : "";

  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(options.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; background: radial-gradient(circle at top, #172554, #090d16 52%); color: #f8fafc; margin: 0; padding: 32px 16px; display: grid; place-items: center; min-height: 100vh; }
    .card { max-width: 580px; width: 100%; background: rgba(15, 23, 42, .92); border: 1px solid #334155; border-radius: 20px; padding: 32px; box-shadow: 0 25px 60px rgba(0,0,0,.45); }
    .eyebrow { color: #818cf8; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 8px 0 12px; font-size: 24px; }
    p { color: #cbd5e1; line-height: 1.65; }
    code { background: #1e293b; color: #7dd3fc; padding: 2px 6px; border-radius: 6px; }
    ol { color: #cbd5e1; line-height: 1.7; padding-left: 22px; }
    li { margin: 7px 0; }
    .link { color: #93c5fd; }
    .actions { display: flex; gap: 10px; margin-top: 26px; flex-wrap: wrap; }
    .btn { flex: 1; min-width: 170px; text-align: center; padding: 12px 18px; border-radius: 10px; font-weight: 650; text-decoration: none; }
    .primary { background: linear-gradient(135deg, #6366f1, #2563eb); color: white; }
    .secondary { background: #1e293b; border: 1px solid #475569; color: #e2e8f0; }
  </style>
</head>
<body><main class="card">
  <div class="eyebrow">GitInsight AI</div>
  <h1>${escapeHtml(options.title)}</h1>
  <p>${escapeHtml(options.message)}</p>
  ${setup}
  <div class="actions">
    <a class="btn primary" href="/#preview">Explore sample preview</a>
    <a class="btn secondary" href="/">Return home</a>
  </div>
</main></body></html>`,
    {
      status: options.status ?? 400,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

function isGitHubUserResponse(value: unknown): value is GitHubUserResponse {
  if (typeof value !== "object" || value === null) return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === "number" &&
    typeof user.login === "string" &&
    typeof user.avatar_url === "string" &&
    typeof user.html_url === "string" &&
    [user.name, user.email, user.bio].every(
      (field) => field === null || typeof field === "string",
    ) &&
    [user.public_repos, user.followers, user.following].every((field) => typeof field === "number")
  );
}

/**
 * Parses cookie header and extracts a specific cookie value.
 */
export function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)(${name})=([^;]*)`));
  try {
    return match ? decodeURIComponent(match[3]) : null;
  } catch {
    return null;
  }
}

/**
 * Extracts GitHub token from Cookies, Headers, or Env.
 */
export function getAuthToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || request.headers.get("Cookie");
  const cookieToken = getCookieValue(cookieHeader, "github_token");
  if (cookieToken) return cookieToken;

  return extractGitHubToken(request);
}

/**
 * Initiates GitHub OAuth by redirecting to GitHub's authorize page.
 */
function oauthConfiguration(
  request: Request,
): { clientId: string; clientSecret: string; redirectUri: string } | null {
  const clientId = getEnv("GITHUB_CLIENT_ID").trim();
  const clientSecret = getEnv("GITHUB_CLIENT_SECRET").trim();
  if ([clientId, clientSecret].some((value) => !value || value.startsWith("your_github_")))
    return null;
  try {
    const redirect = new URL(
      getEnv("GITHUB_CALLBACK_URL").trim() || "/api/auth/github/callback",
      request.url,
    );
    if (
      !["http:", "https:"].includes(redirect.protocol) ||
      redirect.username ||
      redirect.password ||
      redirect.hash ||
      redirect.search ||
      redirect.pathname !== "/api/auth/github/callback"
    )
      return null;
    // The state cookie must return to the same origin that started sign-in.
    if (redirect.origin !== new URL(request.url).origin) return null;
    return { clientId, clientSecret, redirectUri: redirect.toString() };
  } catch {
    return null;
  }
}

function configurationHelp(): Response {
  return oauthHelpPage({
    title: "GitHub sign-in needs configuration",
    message:
      "Sign-in is not configured correctly on this server. You can still explore the sample preview without connecting GitHub.",
    status: 503,
    showSetup: true,
  });
}

function stateCookie(request: Request, value: string, maxAge: number): string {
  return `github_oauth_state=${value}; Path=/api/auth/github; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}

export function handleGitHubLogin(request: Request): Response {
  const config = oauthConfiguration(request);
  if (!config) return configurationHelp();
  const state = randomBytes(32).toString("hex");
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", config.clientId);
  githubAuthUrl.searchParams.set("redirect_uri", config.redirectUri);
  githubAuthUrl.searchParams.set("scope", "repo read:user user:email");
  githubAuthUrl.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: githubAuthUrl.toString(),
      "Set-Cookie": stateCookie(request, state, 600),
      "Cache-Control": "no-store",
    },
  });
}

export async function handleGitHubCallback(request: Request): Promise<Response> {
  const response = await completeGitHubCallback(request);
  response.headers.append("Set-Cookie", stateCookie(request, "", 0));
  return response;
}

async function completeGitHubCallback(request: Request): Promise<Response> {
  const config = oauthConfiguration(request);
  if (!config) return configurationHelp();
  const { clientId, clientSecret, redirectUri } = config;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = getCookieValue(request.headers.get("cookie"), "github_oauth_state");
  if (!state || !expectedState || state !== expectedState) {
    return oauthHelpPage({
      title: "Please restart GitHub sign-in",
      message:
        "Your sign-in session expired or could not be verified. Return home and choose Log in again.",
    });
  }
  if (url.searchParams.has("error") || !code) {
    return oauthHelpPage({
      title: "GitHub sign-in was not completed",
      message:
        "Authorization was cancelled or no authorization code was received. You can try again from the homepage.",
    });
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "GitInsight-AI",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData: unknown = await tokenRes.json();
    if (
      !tokenRes.ok ||
      typeof tokenData !== "object" ||
      tokenData === null ||
      !("access_token" in tokenData) ||
      typeof tokenData.access_token !== "string" ||
      !tokenData.access_token ||
      "error" in tokenData
    ) {
      return oauthHelpPage({
        title: "GitHub could not complete sign-in",
        message:
          "The authorization may have expired, or the server credentials may need updating. Return home to try again. If this continues, contact the site owner.",
        status: 502,
      });
    }
    const accessToken = tokenData.access_token;

    // Fetch user profile
    const userRes = await fetch("https://api.github.com/user", {
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "GitInsight-AI",
      },
    });

    const userData: unknown = await userRes.json();
    if (!userRes.ok || !isGitHubUserResponse(userData)) {
      throw new Error("GitHub returned an invalid user profile response.");
    }

    const userProfile: GitHubUserProfile = {
      id: userData.id,
      login: userData.login,
      name: userData.name || userData.login,
      avatar_url: userData.avatar_url,
      email: userData.email,
      bio: userData.bio,
      public_repos: userData.public_repos || 0,
      followers: userData.followers || 0,
      following: userData.following || 0,
      html_url: userData.html_url,
    };

    // Store in cookie and sync with localStorage via HTML bridge
    const isSecure = url.protocol === "https:";
    const cookie = `github_token=${encodeURIComponent(accessToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${isSecure ? "; Secure" : ""}`; // 30 days
    const htmlBridge = `<!DOCTYPE html>
<html>
<head>
  <title>Authenticating...</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { text-align: center; padding: 32px; border-radius: 16px; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); }
    .spinner { width: 36px; height: 36px; border: 3px solid rgba(99, 102, 241, 0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <p>Signing in as <strong>${escapeHtml(userProfile.login)}</strong>...</p>
  </div>
  <script>
    try {
      localStorage.removeItem("github_token");
      localStorage.setItem("github_user", ${JSON.stringify(JSON.stringify(userProfile)).replace(/</g, "\\u003c")});
    } catch(e) { console.error(e); }
    window.location.href = "/dashboard";
  </script>
</body>
</html>`;

    return new Response(htmlBridge, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Set-Cookie": cookie,
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error: unknown) {
    const message =
      "We could not finish connecting to GitHub. Please return home and try again. If the problem continues, contact the site owner.";
    return oauthHelpPage({ title: "GitHub sign-in failed", message, status: 502 });
  }
}

/**
 * Returns the currently authenticated user's profile.
 */
export async function handleGetUser(request: Request): Promise<Response> {
  const token = getAuthToken(request);

  if (!token) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: "User is not authenticated." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "GitInsight-AI",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      return new Response(JSON.stringify({ error: "GitHub Error", message: err.message }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userData: unknown = await res.json();
    if (!isGitHubUserResponse(userData)) throw new Error("Invalid GitHub profile");
    const userProfile: GitHubUserProfile = {
      id: userData.id,
      login: userData.login,
      name: userData.name || userData.login,
      avatar_url: userData.avatar_url,
      email: userData.email,
      bio: userData.bio,
      public_repos: userData.public_repos || 0,
      followers: userData.followers || 0,
      following: userData.following || 0,
      html_url: userData.html_url,
    };

    return new Response(JSON.stringify(userProfile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Server Error", message: "Unable to load your GitHub profile." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

/**
 * Clears session and logs out.
 */
export function handleLogout(): Response {
  const cookie = "github_token=; Path=/; SameSite=Lax; Max-Age=0";
  return new Response(
    `<!DOCTYPE html><html><body><script>localStorage.removeItem("github_token"); localStorage.removeItem("github_user"); window.location.href = "/";</script></body></html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Set-Cookie": cookie,
      },
    },
  );
}

/**
 * Node / Connect adapter for Vite dev server authentication routes.
 */
export async function nodeAuthRouter(
  req: IncomingMessage & { originalUrl?: string },
  res: ServerResponse,
  next: () => void,
): Promise<void> {
  const protocol = (req.socket as TLSSocket).encrypted ? "https" : "http";
  const host = req.headers.host || "localhost:8080";
  const fullUrl = `${protocol}://${host}${req.originalUrl || req.url}`;
  const parsedUrl = new URL(fullUrl);

  const reqHeaders = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) reqHeaders.set(key, Array.isArray(value) ? value.join(", ") : (value as string));
  }

  const webRequest = new Request(fullUrl, {
    method: req.method,
    headers: reqHeaders,
  });

  let webResponse: Response | null = null;

  if (parsedUrl.pathname === "/api/auth/github") {
    webResponse = handleGitHubLogin(webRequest);
  } else if (parsedUrl.pathname === "/api/auth/github/callback") {
    webResponse = await handleGitHubCallback(webRequest);
  } else if (parsedUrl.pathname === "/api/auth/user") {
    webResponse = await handleGetUser(webRequest);
  } else if (parsedUrl.pathname === "/api/auth/logout") {
    webResponse = handleLogout();
  }

  if (webResponse) {
    res.statusCode = webResponse.status;
    webResponse.headers.forEach((val, key) => {
      if (key !== "set-cookie") res.setHeader(key, val);
    });
    const cookies = webResponse.headers.getSetCookie();
    if (cookies.length) res.setHeader("Set-Cookie", cookies);
    const body = await webResponse.text();
    res.end(body);
    return;
  }

  next();
}
