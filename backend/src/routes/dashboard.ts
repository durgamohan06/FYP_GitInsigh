/**
 * Dashboard Routes — /api/dashboard
 *
 *   GET /api/dashboard → Overall GitHub dashboard metrics
 */

import { Router } from "express";
import { handleGetDashboard } from "../services/dashboard-api.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/", handleGetDashboard);
