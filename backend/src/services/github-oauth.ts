import { extractGitHubToken } from "./github-api";
import { getEnv } from "../config/env";

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

/**
 * Parses cookie header and extracts a specific cookie value.
 */
export function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)(${name})=([^;]*)`));
  return match ? decodeURIComponent(match[3]) : null;
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
export function handleGitHubLogin(request: Request): Response {
  const clientId = getEnv("GITHUB_CLIENT_ID", "Iv23liFzPGTzIk1iIXLo");
  if (!clientId) {
    return new Response(
      JSON.stringify({
        error: "Configuration Error",
        message:
          "GITHUB_CLIENT_ID is not configured in .env. Please register an OAuth App in GitHub.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const url = new URL(request.url);
  const redirectUri =
    getEnv("GITHUB_CALLBACK_URL") || `${url.protocol}//${url.host}/api/auth/github/callback`;

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
  githubAuthUrl.searchParams.set("scope", "repo read:user user:email");
  githubAuthUrl.searchParams.set("state", Math.random().toString(36).substring(2, 15));

  return Response.redirect(githubAuthUrl.toString(), 302);
}

/**
 * Handles the OAuth Callback from GitHub.
 */
export async function handleGitHubCallback(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error || !code) {
    const errorMsg = errorDescription || error || "No authorization code received from GitHub.";
    return new Response(
      `<!DOCTYPE html><html><head><title>Authentication Failed</title><style>body{font-family:sans-serif;padding:40px;background:#0d1117;color:#fff;text-align:center}a{color:#58a6ff;text-decoration:none;font-weight:bold}</style></head><body><h2>Authentication Failed</h2><p>${errorMsg}</p><p><a href="/">Return to Login</a></p></body></html>`,
      { status: 400, headers: { "Content-Type": "text/html" } },
    );
  }

  const clientId = getEnv("GITHUB_CLIENT_ID", "Iv23liFzPGTzIk1iIXLo");
  const clientSecret = getEnv("GITHUB_CLIENT_SECRET", "2861ac935322926f58eed6b1f09f6f951551b38a");

  if (!clientId || !clientSecret) {
    return new Response(
      `<!DOCTYPE html><html><head><title>Configuration Missing</title><style>body{font-family:sans-serif;padding:40px;background:#0d1117;color:#fff;text-align:center}a{color:#58a6ff;text-decoration:none;font-weight:bold}</style></head><body><h2>OAuth Credentials Missing</h2><p>GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is missing in .env.</p><p><a href="/">Return to Login</a></p></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } },
    );
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "GitInsight-AI",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      throw new Error(
        tokenData.error_description || tokenData.error || "Failed to exchange OAuth code.",
      );
    }

    const accessToken = tokenData.access_token;

    // Fetch user profile
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "GitInsight-AI",
      },
    });

    const userData = await userRes.json();

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
    const cookie = `github_token=${accessToken}; Path=/; SameSite=Lax; Max-Age=2592000`; // 30 days
    const frontendUrl = getEnv("FRONTEND_URL", "http://localhost:8080").replace(/\/$/, "");
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
    <p>Signing in as <strong>${userProfile.login}</strong>...</p>
  </div>
  <script>
    try {
      localStorage.setItem("github_token", ${JSON.stringify(accessToken)});
      localStorage.setItem("github_user", ${JSON.stringify(JSON.stringify(userProfile))});
    } catch(e) { console.error(e); }
    window.location.href = ${JSON.stringify(`${frontendUrl}/dashboard`)};
  </script>
</body>
</html>`;

    return new Response(htmlBridge, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Set-Cookie": cookie,
      },
    });
  } catch (err: any) {
    return new Response(
      `<!DOCTYPE html><html><head><title>OAuth Error</title><style>body{font-family:sans-serif;padding:40px;background:#0d1117;color:#fff;text-align:center}a{color:#58a6ff;text-decoration:none;font-weight:bold}</style></head><body><h2>Login Error</h2><p>${err.message}</p><p><a href="/">Return to Login</a></p></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } },
    );
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

    const userData = await res.json();
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
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Server Error", message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
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
export async function nodeAuthRouter(req: any, res: any, next: any) {
  const protocol = req.socket?.encrypted ? "https" : "http";
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
      res.setHeader(key, val);
    });
    const body = await webResponse.text();
    res.end(body);
    return;
  }

  next();
}
