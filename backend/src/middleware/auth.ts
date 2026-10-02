import type { Request, Response, NextFunction } from "express";
import { getCookieValue } from "../services/github-oauth.js";
import { extractGitHubToken } from "../services/github-api.js";

/**
 * Extracts the GitHub auth token from cookie, Authorization header, or X-GitHub-Token header.
 * Attaches it to `req.githubToken` for use by route handlers.
 */
export function extractToken(req: Request, _res: Response, next: NextFunction): void {
  // Adapt the Request object to match the Web API-style Request expected by existing services
  const webRequest = buildWebRequest(req);
  const token = extractGitHubToken(webRequest as unknown as Request);
  (req as any).githubToken = token;
  next();
}

/**
 * Middleware that requires a valid GitHub token.
 * Returns 401 if not authenticated.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const cookieHeader = req.headers["cookie"] ?? "";
  const cookieToken = getCookieValue(cookieHeader, "github_token");
  const authHeader = req.headers["authorization"] ?? req.headers["x-github-token"] ?? "";
  const token = cookieToken ?? (authHeader ? authHeader.replace(/^Bearer\s+/i, "") : null);

  if (!token) {
    res.status(401).json({ error: "Unauthorized", message: "GitHub authentication required." });
    return;
  }

  (req as any).githubToken = token;
  next();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds a Web API-style Request object from an Express req
 * so we can reuse the existing service functions unchanged.
 */
export function buildWebRequest(req: Request): { headers: { get: (key: string) => string | null }; url: string; method: string } {
  return {
    url: `http://${req.headers.host}${req.url}`,
    method: req.method,
    headers: {
      get: (key: string) => {
        const val = req.headers[key.toLowerCase()];
        if (Array.isArray(val)) return val.join(", ");
        return val ?? null;
      },
    },
  };
}
