/**
 * Dashboard Routes — /api/dashboard
 *
 *   GET /api/dashboard → Overall GitHub dashboard metrics
 */

import { Router } from "express";
import { handleGetDashboard } from "../services/dashboard-api.js";
import { adaptWebHandler } from "../utils/adapt-web-handler.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/", adaptWebHandler(handleGetDashboard));
