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
  const token = extractGitHubToken(webRequest);
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
  const header = req.headers["authorization"] ?? req.headers["x-github-token"] ?? "";
  const authHeader = Array.isArray(header) ? header[0] || "" : header;
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
export function buildWebRequest(req: Request): globalThis.Request {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  return new globalThis.Request(`${req.protocol}://${req.headers.host}${req.originalUrl || req.url}`, { method: req.method, headers });
}
