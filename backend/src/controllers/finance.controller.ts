import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError } from "../errors/AppError";
import { CategoryGroupService } from "../services/categoryGroup.service";
import { CategoryService } from "../services/category.service";
import { MonthlySummaryService } from "../services/monthlySummary.service";
import { TransactionService } from "../services/transaction.service";

const transactionService = new TransactionService();
const categoryService = new CategoryService();
const categoryGroupService = new CategoryGroupService();
const monthlySummaryService = new MonthlySummaryService();

const monthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  type: z.enum(["expense", "income"]).optional(),
});

const createTransactionSchema = z.object({
  date: z.string().min(1),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default("CAD"),
  categoryId: z.string().uuid().nullable().optional(),
  mainCategory: z.string().nullable().optional(),
  type: z.enum(["expense", "income"]).default("expense"),
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
  type: z.enum(["expense", "income"]),
  categoryName: z.string().nullable().optional(),
  groupName: z.string().nullable().optional(),
  currency: z.string().default("CAD"),
});
const importTransactionsSchema = z.object({
  rows: z.array(importTransactionRowSchema).min(1).max(1000),
});
const categorySchema = z.object({
  name: z.string().trim().min(1),
  groupId: z.string().uuid().nullable().optional(),
  type: z.enum(["expense", "income"]).default("expense"),
  isFixed: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});
const updateCategorySchema = categorySchema.partial();
const categoryGroupSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(["expense", "income"]).default("expense"),
  sortOrder: z.number().int().default(0),
});
const updateCategoryGroupSchema = categoryGroupSchema.partial();

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
    const { type } = monthQuerySchema.pick({ type: true }).parse(req.query);
    const data = await categoryService.list(user.id, type);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function listCategoryGroups(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { type } = monthQuerySchema.pick({ type: true }).parse(req.query);
    const data = await categoryGroupService.list(user.id, type);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function createCategoryGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const data = categoryGroupSchema.parse(req.body);
    const row = await categoryGroupService.create(user.id, data);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
}

export async function updateCategoryGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const patch = updateCategoryGroupSchema.parse(req.body);
    const row = await categoryGroupService.update(user.id, req.params.id as string, patch);
    res.json(row);
  } catch (err) {
    next(err);
  }
}

export async function deleteCategoryGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    await categoryGroupService.delete(user.id, req.params.id as string);
    res.status(204).send();
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
