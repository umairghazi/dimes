import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { getSupabaseAdminClient } from "../integrations/supabase/supabaseAdmin.client";

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError("Authorization header missing or malformed", 401, "UNAUTHORIZED");
    }

    const token = header.slice(7);
    const { data, error } = await getSupabaseAdminClient().auth.getUser(token);
    if (error || !data.user) {
      throw new AppError("Invalid or expired token", 401, "UNAUTHORIZED");
    }

    req.user = { id: data.user.id, email: data.user.email ?? "" };
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError("Invalid or expired token", 401, "UNAUTHORIZED"));
  }
}
