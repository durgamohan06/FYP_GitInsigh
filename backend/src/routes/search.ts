/**
 * Search & Notifications Routes
 *
 *   GET /api/search        → Global search across repos, issues, users
 *   GET /api/notifications → GitHub notifications for authenticated user
 */

import { Router } from "express";
import { handleGetGlobalSearch, handleGetNotifications } from "../services/github-global-api.js";

export const searchRoutes = Router();

searchRoutes.get("/", handleGetGlobalSearch);
searchRoutes.get("/notifications", handleGetNotifications);
