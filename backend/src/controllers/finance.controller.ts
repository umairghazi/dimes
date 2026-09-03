import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getFinanceDataSource } from "../dataSources/FinanceDataSourceFactory";
import { AppError } from "../errors/AppError";

const transactionQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  type: z.enum(["expense", "income"]).optional(),
});

function requireUser(req: Request): { id: string; email: string } {
  if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  return req.user;
}

export async function getFinanceStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(getFinanceDataSource().status());
  } catch (err) {
    next(err);
  }
}

export async function listFinanceTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const filters = transactionQuerySchema.parse(req.query);
    const data = await getFinanceDataSource().listTransactions(user.id, filters);
    res.json({ data, total: data.length });
  } catch (err) {
    next(err);
  }
}
