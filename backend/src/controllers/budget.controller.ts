import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { BudgetService } from "../services/budget.service";
import { BudgetRepository } from "../repositories/budget.repository";
import { AppError } from "../errors/AppError";
const budgetService = new BudgetService(new BudgetRepository());

const createSchema = z.object({
  category: z.string().min(1),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, "monthYear must be YYYY-MM"),
  limitAmount: z.number().positive(),
  currency: z.string().default("USD"),
  alertThreshold: z.number().min(0).max(1).optional(),
});

const updateSchema = z.object({
  limitAmount: z.number().positive().optional(),
  alertThreshold: z.number().min(0).max(1).optional(),
});

function requireUser(req: Request) {
  if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  return req.user;
}

export async function listBudgets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const budgets = await budgetService.getBudgets(user.id);
    res.json(budgets);
  } catch (err) {
    next(err);
  }
}

export async function createBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const dto = createSchema.parse(req.body);
    const budget = await budgetService.createBudget(user.id, dto);
    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
}

export async function updateBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const dto = updateSchema.parse(req.body);
    const budget = await budgetService.updateBudget(user.id, req.params.id, dto);
    res.json(budget);
  } catch (err) {
    next(err);
  }
}

export async function deleteBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    await budgetService.deleteBudget(user.id, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
