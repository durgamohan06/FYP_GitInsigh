import type { Request, Response } from "express";
import { extractGitHubToken } from "./github-api.js";
import { getEnv } from "../config/env.js";

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
export function getAuthToken(request: Request | any): string | null {
  let cookieHeader: string | undefined;
  if (request?.headers) {
    if (typeof request.headers.get === "function") {
      cookieHeader = request.headers.get("cookie") || request.headers.get("Cookie") || undefined;
    } else {
      const c = request.headers["cookie"] || request.headers["Cookie"];
      cookieHeader = Array.isArray(c) ? c.join("; ") : c;
    }
  }
  const cookieToken = getCookieValue(cookieHeader ?? null, "github_token");
  if (cookieToken) return cookieToken;

  return extractGitHubToken(request);
}

/**
 * Initiates GitHub OAuth by redirecting to GitHub's authorize page.
 */
export function handleGitHubLogin(req: Request, res: Response): void {
  const clientId = getEnv("GITHUB_CLIENT_ID", "Iv23liFzPGTzIk1iIXLo");
  if (!clientId) {
    res.status(500).json({
      error: "Configuration Error",
      message:
        "GITHUB_CLIENT_ID is not configured in .env. Please register an OAuth App in GitHub.",
    });
    return;
  }

  const protocol = req.protocol ?? "http";
  const host = req.get("host") ?? "localhost:3001";
  const redirectUri =
    getEnv("GITHUB_CALLBACK_URL") || `${protocol}://${host}/api/auth/github/callback`;

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
  githubAuthUrl.searchParams.set("scope", "repo read:user user:email");
  githubAuthUrl.searchParams.set("state", Math.random().toString(36).substring(2, 15));

  res.redirect(githubAuthUrl.toString());
}

/**
 * Handles the OAuth Callback from GitHub.
 */
export async function handleGitHubCallback(req: Request, res: Response): Promise<void> {
  const code = req.query.code as string | undefined;
  const error = req.query.error as string | undefined;
  const errorDescription = req.query.error_description as string | undefined;

  if (error || !code) {
    const errorMsg = errorDescription || error || "No authorization code received from GitHub.";
    res.status(400).send(
      `<!DOCTYPE html><html><head><title>Authentication Failed</title><style>body{font-family:sans-serif;padding:40px;background:#0d1117;color:#fff;text-align:center}a{color:#58a6ff;text-decoration:none;font-weight:bold}</style></head><body><h2>Authentication Failed</h2><p>${errorMsg}</p><p><a href="/">Return to Login</a></p></body></html>`,
    );
    return;
  }

  const clientId = getEnv("GITHUB_CLIENT_ID", "Iv23liFzPGTzIk1iIXLo");
  const clientSecret = getEnv("GITHUB_CLIENT_SECRET", "2861ac935322926f58eed6b1f09f6f951551b38a");

  if (!clientId || !clientSecret) {
    res.status(500).send(
      `<!DOCTYPE html><html><head><title>Configuration Missing</title><style>body{font-family:sans-serif;padding:40px;background:#0d1117;color:#fff;text-align:center}a{color:#58a6ff;text-decoration:none;font-weight:bold}</style></head><body><h2>OAuth Credentials Missing</h2><p>GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is missing in .env.</p><p><a href="/">Return to Login</a></p></body></html>`,
    );
    return;
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

    res.setHeader("Set-Cookie", cookie);
    res.setHeader("Content-Type", "text/html");
    res.send(htmlBridge);
  } catch (err: any) {
    res.status(500).send(
      `<!DOCTYPE html><html><head><title>OAuth Error</title><style>body{font-family:sans-serif;padding:40px;background:#0d1117;color:#fff;text-align:center}a{color:#58a6ff;text-decoration:none;font-weight:bold}</style></head><body><h2>Login Error</h2><p>${err.message}</p><p><a href="/">Return to Login</a></p></body></html>`,
    );
  }
}

/**
 * Returns the currently authenticated user's profile.
 */
export async function handleGetUser(req: Request, res: Response): Promise<void> {
  const token = getAuthToken(req);

  if (!token) {
    res.status(401).json({ error: "Unauthorized", message: "User is not authenticated." });
    return;
  }

  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "GitInsight-AI",
      },
    });

    if (!userRes.ok) {
      const err = await userRes.json().catch(() => ({ message: userRes.statusText }));
      res.status(userRes.status).json({ error: "GitHub Error", message: err.message });
      return;
    }

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

    res.json(userProfile);
  } catch (err: any) {
    res.status(500).json({ error: "Server Error", message: err.message });
  }
}

/**
 * Clears session and logs out.
 */
export function handleLogout(_req: Request, res: Response): void {
  const cookie = "github_token=; Path=/; SameSite=Lax; Max-Age=0";
  res.setHeader("Set-Cookie", cookie);
  res.setHeader("Content-Type", "text/html");
  res.send(
    `<!DOCTYPE html><html><body><script>localStorage.removeItem("github_token"); localStorage.removeItem("github_user"); window.location.href = "/";</script></body></html>`,
  );
}

/**
 * Node / Connect adapter for Vite dev server authentication routes (if needed).
 */
export async function nodeAuthRouter(req: any, res: any, next: any) {
  if (typeof res.json !== "function") {
    res.json = (data: any) => {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    };
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
    res.send = (body: string) => {
      res.end(body);
    };
    res.redirect = (url: string) => {
      res.statusCode = 302;
      res.setHeader("Location", url);
      res.end();
    };
  }

  const path = (req.originalUrl || req.url || "").split("?")[0];
  if (path.endsWith("/github")) {
    return handleGitHubLogin(req, res);
  } else if (path.endsWith("/github/callback")) {
    return handleGitHubCallback(req, res);
  } else if (path.endsWith("/user")) {
    return handleGetUser(req, res);
  } else if (path.endsWith("/logout")) {
    return handleLogout(req, res);
  }

  if (next) next();
}
