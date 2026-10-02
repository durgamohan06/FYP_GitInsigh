/**
 * Repos Routes — /api/repos
 *
 *   GET /api/repos          → List all repositories for authenticated user
 *   GET /api/repos/insights → Repository insights (owned, collaborated, contributed)
 *   GET /api/repos/detail   → Detailed repository analytics
 */

import { Router } from "express";
import { handleGetRepos } from "../services/github-api.js";
import { handleGetRepoInsights } from "../services/repo-insights.js";
import { handleGetRepoDetail } from "../services/repo-detail-api.js";
import { adaptWebHandler } from "../utils/adapt-web-handler.js";

export const reposRoutes = Router();

reposRoutes.get("/", adaptWebHandler(handleGetRepos));
reposRoutes.get("/insights", adaptWebHandler(handleGetRepoInsights));
reposRoutes.get("/detail", adaptWebHandler(handleGetRepoDetail));
