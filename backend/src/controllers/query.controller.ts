import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { NLQueryService } from "../services/nlQuery.service";
import { NLQueryRepository } from "../repositories/nlQuery.repository";
import { AppError } from "../errors/AppError";

const nlQueryService = new NLQueryService(new NLQueryRepository());

const querySchema = z.object({
  query: z.string().min(1),
  mode: z.enum(["ask", "add"]).default("ask"),
});

function requireUser(req: Request) {
  if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  return req.user;
}

export async function nlQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { query, mode } = querySchema.parse(req.body);
    const result = await nlQueryService.query(query, { userId: user.id }, mode);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
