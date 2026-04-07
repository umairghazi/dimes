import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AnalyticsService } from "../services/analytics.service";
import { ExpenseRepository } from "../repositories/expense.repository";
import { BudgetRepository } from "../repositories/budget.repository";
import { AppError } from "../errors/AppError";

const analyticsService = new AnalyticsService(new ExpenseRepository(), new BudgetRepository());

function requireUser(req: Request) {
  if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  return req.user;
}

const monthSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

const trendsSchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { month } = monthSchema.parse(req.query);
    const now = new Date();
    const monthYear =
      month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const summary = await analyticsService.getMonthlySummary(user.id, monthYear);
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

export async function getTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { months } = trendsSchema.parse(req.query);
    const trends = await analyticsService.getTrends(user.id, months);
    res.json(trends);
  } catch (err) {
    next(err);
  }
}

export async function getRecurring(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const recurring = await analyticsService.getRecurringTransactions(user.id);
    res.json(recurring);
  } catch (err) {
    next(err);
  }
}

export async function getInsight(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { month } = monthSchema.parse(req.query);
    const now = new Date();
    const monthYear =
      month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const insight = await analyticsService.generateInsight(user.id, monthYear);
    res.json({ insight });
  } catch (err) {
    next(err);
  }
}
