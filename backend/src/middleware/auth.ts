import type { Request, Response, NextFunction } from "express";
import { extractGitHubToken } from "../services/github-api.js";

/**
 * Extracts the GitHub auth token from cookie, Authorization header, or X-GitHub-Token header.
 * Attaches it to `req.githubToken` for use by route handlers.
 */
export function extractToken(req: Request, _res: Response, next: NextFunction): void {
  const token = extractGitHubToken(req);
  (req as any).githubToken = token;
  next();
}

/**
 * Middleware that requires a valid GitHub token.
 * Returns 401 if not authenticated.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractGitHubToken(req);

  if (!token) {
    res.status(401).json({ error: "Unauthorized", message: "GitHub authentication required." });
    return;
  }

  (req as any).githubToken = token;
  next();
}
