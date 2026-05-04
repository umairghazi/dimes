import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { BalanceService } from "../services/balance.service";
import { BalanceRepository } from "../repositories/balance.repository";
import { ExpenseRepository } from "../repositories/expense.repository";
import { AppError } from "../errors/AppError";

const balanceService = new BalanceService(new BalanceRepository(), new ExpenseRepository());

function requireUser(req: Request) {
  if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  return req.user;
}

const monthSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

const upsertSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/),
  startingBalance: z.number(),
  endingBalance: z.number().nullable().optional(),
  currency: z.string().default("CAD"),
});

export async function getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { month } = monthSchema.parse(req.query);
    const now = new Date();
    const monthYear = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const result = await balanceService.getMonthlyBalance(user.id, monthYear);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function upsertBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { monthYear, startingBalance, endingBalance, currency } = upsertSchema.parse(req.body);
    const result = await balanceService.upsertBalance(user.id, monthYear, startingBalance, endingBalance, currency);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
