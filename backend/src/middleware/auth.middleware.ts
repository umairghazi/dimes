import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";
import { getSupabaseAdminClient } from "../integrations/supabase/supabaseAdmin.client";

interface AccessTokenPayload {
  sub: string;
  email: string;
}

function bearerToken(req: Request): string {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError("Authorization header missing or malformed", 401, "UNAUTHORIZED");
  }
  return header.slice(7);
}

function authenticateLegacyToken(token: string): { id: string; email: string } {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  return { id: payload.sub, email: payload.email };
}

async function authenticateSupabaseToken(token: string): Promise<{ id: string; email: string }> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user?.email) {
    throw new AppError("Invalid or expired Supabase token", 401, "UNAUTHORIZED");
  }

  return { id: data.user.id, email: data.user.email };
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = bearerToken(req);

    if (env.AUTH_PROVIDER === "supabase") {
      req.user = await authenticateSupabaseToken(token);
    } else if (env.AUTH_PROVIDER === "hybrid") {
      try {
        req.user = authenticateLegacyToken(token);
      } catch {
        req.user = await authenticateSupabaseToken(token);
      }
    } else {
      req.user = authenticateLegacyToken(token);
    }
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError("Invalid or expired token", 401, "UNAUTHORIZED"));
  }
}
