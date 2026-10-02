import type { Request, Response, NextFunction } from "express";

/**
 * Global Express error handler middleware.
 * Must be registered last (after all routes).
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error("[GitInsight Error]", err.message, err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred.",
  });
}
