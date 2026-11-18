/**
 * Team Routes — /api/team
 *
 *   GET /api/team/analytics → Team analytics for a given repository
 *   GET /api/team/projects  → Projects for given contributors
 */

import { Router } from "express";
import { handleGetTeamAnalytics } from "../services/github-team-analytics-api.js";
import { handleGetTeamProjects } from "../services/github-team-projects-api.js";

export const teamRoutes = Router();

teamRoutes.get("/analytics", handleGetTeamAnalytics);
teamRoutes.get("/projects", handleGetTeamProjects);
