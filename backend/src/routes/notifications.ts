/**
 * Notifications Routes — /api/notifications
 *
 *   GET /api/notifications → GitHub notifications for authenticated user
 */

import { Router } from "express";
import { handleGetNotifications } from "../services/github-global-api.js";
import { adaptWebHandler } from "../utils/adapt-web-handler.js";

export const notificationsRoutes = Router();

notificationsRoutes.get("/", adaptWebHandler(handleGetNotifications));
