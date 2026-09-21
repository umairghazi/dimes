import { Request, Response, NextFunction } from "express";
import { z } from "zod";

const monthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  type: z.enum(["expense", "income", "expense_refund"]).optional(),
});
const yearQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
});
const dateRangeQuerySchema = z.object({
  from: z.string().date(),
  to: z.string().date(),
}).superRefine(({ from, to }, context) => {
  const fromTime = Date.parse(`${from}T00:00:00Z`);
  const toTime = Date.parse(`${to}T00:00:00Z`);
  if (fromTime > toTime) {
    context.addIssue({ code: "custom", message: "From date must be on or before to date", path: ["from"] });
  }
  if ((toTime - fromTime) / 86_400_000 > 366) {
    context.addIssue({ code: "custom", message: "Date range cannot exceed 367 days", path: ["to"] });
  }
});

const createTransactionSchema = z.object({
  date: z.string().min(1),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  description: z.string().trim().min(1).max(500),
  amount: z.number().positive(),
  currency: z.string().trim().min(3).max(3).default("CAD"),
  categoryId: z.string().uuid().nullable().optional(),
  type: z.enum(["expense", "income", "expense_refund"]).default("expense"),
  merchantName: z.string().trim().max(200).nullable().optional(),
  source: z.string().trim().min(1).max(50).default("manual"),
  isRecurring: z.boolean().default(false),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  originalDescription: z.string().trim().max(1000).nullable().optional(),
});

const updateTransactionSchema = createTransactionSchema.partial();
const importTransactionRowSchema = z.object({
  date: z.string().min(1),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  description: z.string().trim().min(1).max(500),
  amount: z.number().positive(),
  type: z.enum(["expense", "income", "expense_refund"]),
  categoryName: z.string().trim().max(200).nullable().optional(),
  parentName: z.string().trim().max(200).nullable().optional(),
  currency: z.string().trim().min(3).max(3).default("CAD"),
});
const importTransactionsSchema = z.object({
  rows: z.array(importTransactionRowSchema).min(1).max(1000),
});
const monthlyBalanceSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/),
  startingBalance: z.number().min(0),
  endingBalance: z.number().min(0).nullable().optional(),
  currency: z.string().trim().min(3).max(3).default("CAD"),
});
const monthlyPlanSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/),
  categoryId: z.string().uuid().nullable().optional(),
  categoryName: z.string().trim().min(1).max(200),
  type: z.enum(["expense", "income"]),
  plannedAmount: z.number().min(0),
  currency: z.string().trim().min(3).max(3).default("CAD"),
  carryForward: z.boolean().default(false),
});
const categorySchema = z.object({
  name: z.string().trim().min(1).max(200),
  parentId: z.string().uuid().nullable().optional(),
  type: z.enum(["expense", "income"]).default("expense"),
  isFixed: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});
const updateCategorySchema = categorySchema.partial();

export async function listTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, transactionService } = req.finance;
    const filters = monthQuerySchema.parse(req.query);
    const data = await transactionService.list(user.id, filters);
    res.json({ data, total: data.length });
  } catch (err) {
    next(err);
  }
}

export async function createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, transactionService } = req.finance;
    const data = createTransactionSchema.parse(req.body);
    const row = await transactionService.create(user.id, data);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
}

export async function importTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, transactionService } = req.finance;
    const data = importTransactionsSchema.parse(req.body);
    const result = await transactionService.importRows(user.id, data.rows);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, transactionService } = req.finance;
    const patch = updateTransactionSchema.parse(req.body);
    const row = await transactionService.update(user.id, req.params.id as string, patch);
    res.json(row);
  } catch (err) {
    next(err);
  }
}

export async function deleteTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, transactionService } = req.finance;
    await transactionService.delete(user.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, categoryService } = req.finance;
    const { type } = z.object({ type: z.enum(["expense", "income"]).optional() }).parse(req.query);
    const data = await categoryService.list(user.id, type);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, categoryService } = req.finance;
    const data = categorySchema.parse(req.body);
    const row = await categoryService.create(user.id, data);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, categoryService } = req.finance;
    const patch = updateCategorySchema.parse(req.body);
    const row = await categoryService.update(user.id, req.params.id as string, patch);
    res.json(row);
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, categoryService } = req.finance;
    await categoryService.delete(user.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, monthlySummaryService } = req.finance;
    const { month } = monthQuerySchema.required({ month: true }).parse(req.query);
    const data = await monthlySummaryService.get(user.id, month);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getYearlySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, monthlySummaryService } = req.finance;
    const { year } = yearQuerySchema.parse(req.query);
    const data = await monthlySummaryService.getYear(user.id, year);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getDateRangeSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, monthlySummaryService } = req.finance;
    const { from, to } = dateRangeQuerySchema.parse(req.query);
    const data = await monthlySummaryService.getRange(user.id, from, to);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function listMonthlyPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, monthlySummaryService } = req.finance;
    const { month } = monthQuerySchema.required({ month: true }).parse(req.query);
    const data = await monthlySummaryService.listPlans(user.id, month);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function upsertMonthlyPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, monthlySummaryService } = req.finance;
    const data = monthlyPlanSchema.parse(req.body);
    const row = await monthlySummaryService.upsertPlan(user.id, data);
    res.json(row);
  } catch (err) {
    next(err);
  }
}

export async function deleteMonthlyPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, monthlySummaryService } = req.finance;
    await monthlySummaryService.deletePlan(user.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getMonthlyBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, monthlySummaryService } = req.finance;
    const { month } = monthQuerySchema.required({ month: true }).parse(req.query);
    const data = await monthlySummaryService.getBalance(user.id, month);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function upsertMonthlyBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, monthlySummaryService } = req.finance;
    const data = monthlyBalanceSchema.parse(req.body);
    const row = await monthlySummaryService.upsertBalance(user.id, data);
    res.json(row);
  } catch (err) {
    next(err);
  }
}
