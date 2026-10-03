/**
 * GitInsight AI — Express Backend Application
 *
 * This is the main entry point for the Express backend server.
 * It handles all API routes for the GitInsight AI frontend.
 */

import "./config/env.js"; // Load .env first
import express from "express";
import cors from "cors";
import { authRoutes } from "./routes/auth.js";
import { reposRoutes } from "./routes/repos.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { teamRoutes } from "./routes/team.js";
import { searchRoutes } from "./routes/search.js";
import { notificationsRoutes } from "./routes/notifications.js";
import { errorHandler } from "./middleware/error-handler.js";
import { handleRepositoryManagement } from "./services/repository-management.js";
import { adaptWebHandler } from "./utils/adapt-web-handler.js";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

// ── Middleware ──────────────────────────────────────────────────────────────

app.use(
  cors({
    // Allow requests from the frontend dev server and production origin
    origin: [
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      process.env.FRONTEND_URL ?? "http://localhost:8080",
    ],
    credentials: true, // Allow cookies (github_token)
  }),
);

app.use(express.json());

// ── API Routes ────────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.all("/api/manage-repository", adaptWebHandler(handleRepositoryManagement));
app.use("/api/repos", reposRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationsRoutes);

// ── Health check ─────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "GitInsight AI Backend", timestamp: new Date().toISOString() });
});

// ── Error handler (must be last) ─────────────────────────────────────────────

app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 GitInsight AI Backend running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;
