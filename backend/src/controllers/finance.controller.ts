import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError } from "../errors/AppError";
import { CategoryService } from "../services/category.service";
import { MonthlySummaryService } from "../services/monthlySummary.service";
import { TransactionService } from "../services/transaction.service";

const transactionService = new TransactionService();
const categoryService = new CategoryService();
const monthlySummaryService = new MonthlySummaryService();

const monthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  type: z.enum(["expense", "income", "expense_refund"]).optional(),
});
const yearQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
});

const createTransactionSchema = z.object({
  date: z.string().min(1),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default("CAD"),
  categoryId: z.string().uuid().nullable().optional(),
  type: z.enum(["expense", "income", "expense_refund"]).default("expense"),
  merchantName: z.string().nullable().optional(),
  source: z.string().default("manual"),
  isRecurring: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  originalDescription: z.string().nullable().optional(),
});

const updateTransactionSchema = createTransactionSchema.partial();
const importTransactionRowSchema = z.object({
  date: z.string().min(1),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  description: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(["expense", "income", "expense_refund"]),
  categoryName: z.string().nullable().optional(),
  parentName: z.string().nullable().optional(),
  currency: z.string().default("CAD"),
});
const importTransactionsSchema = z.object({
  rows: z.array(importTransactionRowSchema).min(1).max(1000),
});
const monthlyBalanceSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/),
  startingBalance: z.number().min(0),
  endingBalance: z.number().min(0).nullable().optional(),
  currency: z.string().default("CAD"),
});
const monthlyPlanSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/),
  categoryId: z.string().uuid().nullable().optional(),
  categoryName: z.string().trim().min(1),
  type: z.enum(["expense", "income"]),
  plannedAmount: z.number().min(0),
  currency: z.string().default("CAD"),
  carryForward: z.boolean().default(false),
});
const categorySchema = z.object({
  name: z.string().trim().min(1),
  parentId: z.string().uuid().nullable().optional(),
  type: z.enum(["expense", "income"]).default("expense"),
  isFixed: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});
const updateCategorySchema = categorySchema.partial();

function requireUser(req: Request): { id: string; email: string } {
  if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  return req.user;
}

export async function listTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const filters = monthQuerySchema.parse(req.query);
    const data = await transactionService.list(user.id, filters);
    res.json({ data, total: data.length });
  } catch (err) {
    next(err);
  }
}

export async function createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const data = createTransactionSchema.parse(req.body);
    const row = await transactionService.create(user.id, data);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
}

export async function importTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const data = importTransactionsSchema.parse(req.body);
    const result = await transactionService.importRows(user.id, data.rows);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const patch = updateTransactionSchema.parse(req.body);
    const row = await transactionService.update(user.id, req.params.id as string, patch);
    res.json(row);
  } catch (err) {
    next(err);
  }
}

export async function deleteTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    await transactionService.delete(user.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { type } = z.object({ type: z.enum(["expense", "income"]).optional() }).parse(req.query);
    const data = await categoryService.list(user.id, type);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const data = categorySchema.parse(req.body);
    const row = await categoryService.create(user.id, data);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const patch = updateCategorySchema.parse(req.body);
    const row = await categoryService.update(user.id, req.params.id as string, patch);
    res.json(row);
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    await categoryService.delete(user.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { month } = monthQuerySchema.required({ month: true }).parse(req.query);
    const data = await monthlySummaryService.get(user.id, month);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getYearlySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { year } = yearQuerySchema.parse(req.query);
    const data = await monthlySummaryService.getYear(user.id, year);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function listMonthlyPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { month } = monthQuerySchema.required({ month: true }).parse(req.query);
    const data = await monthlySummaryService.listPlans(user.id, month);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function upsertMonthlyPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const data = monthlyPlanSchema.parse(req.body);
    const row = await monthlySummaryService.upsertPlan(user.id, data);
    res.json(row);
  } catch (err) {
    next(err);
  }
}

export async function deleteMonthlyPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    await monthlySummaryService.deletePlan(user.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getMonthlyBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { month } = monthQuerySchema.required({ month: true }).parse(req.query);
    const data = await monthlySummaryService.getBalance(user.id, month);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function upsertMonthlyBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const data = monthlyBalanceSchema.parse(req.body);
    const row = await monthlySummaryService.upsertBalance(user.id, data);
    res.json(row);
  } catch (err) {
    next(err);
  }
}
