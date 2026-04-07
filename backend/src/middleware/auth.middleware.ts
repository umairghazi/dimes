import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";

interface AccessTokenPayload {
  sub: string;
  email: string;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError("Authorization header missing or malformed", 401, "UNAUTHORIZED");
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError("Invalid or expired token", 401, "UNAUTHORIZED"));
  }
}
