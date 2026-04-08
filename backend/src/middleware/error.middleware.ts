import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { RepositoryError } from "../errors/RepositoryError";
import { ZodError } from "zod";
import { logger } from "../config/logger";

export function errorMiddleware(
  err: unknown,
  req: Request,
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
    if (err.statusCode >= 500) {
      logger.error({ err, method: req.method, url: req.url }, err.message);
    }
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  if (err instanceof RepositoryError) {
    logger.error({ err: err.cause, operation: err.operation }, "Repository error");
    res.status(500).json({ error: "Database operation failed" });
    return;
  }

  logger.error({ err, method: req.method, url: req.url }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
}
