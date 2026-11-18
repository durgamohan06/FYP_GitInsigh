/**
 * Auth Routes — /api/auth
 *
 * GitHub OAuth flow:
 *   GET /api/auth/github          → Redirect to GitHub OAuth
 *   GET /api/auth/github/callback → OAuth callback handler
 *   GET /api/auth/user            → Get current authenticated user
 *   GET /api/auth/logout          → Clear session and logout
 */

import { Router } from "express";
import {
  handleGitHubLogin,
  handleGitHubCallback,
  handleGetUser,
  handleLogout,
} from "../services/github-oauth.js";

export const authRoutes = Router();

authRoutes.get("/github", handleGitHubLogin);
authRoutes.get("/github/callback", handleGitHubCallback);
authRoutes.get("/user", handleGetUser);
authRoutes.get("/logout", handleLogout);
