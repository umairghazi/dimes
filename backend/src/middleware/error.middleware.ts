import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { RepositoryError } from "../errors/RepositoryError";
import { ZodError } from "zod";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  if (err instanceof RepositoryError) {
    console.error(`[RepositoryError] ${err.operation}:`, err.cause);
    res.status(500).json({ error: "Database operation failed" });
    return;
  }

  console.error("[UnhandledError]", err);
  res.status(500).json({ error: "Internal server error" });
}
