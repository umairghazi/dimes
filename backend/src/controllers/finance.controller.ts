import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError } from "../errors/AppError";
import { FinanceRepository } from "../repositories/finance.repository";

const financeRepo = new FinanceRepository();

const monthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  type: z.enum(["expense", "income"]).optional(),
});

const createTransactionSchema = z.object({
  date: z.string().min(1),
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

function requireUser(req: Request): { id: string; email: string } {
  if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  return req.user;
}

export async function listTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const filters = monthQuerySchema.parse(req.query);
    const data = await financeRepo.listTransactions(user.id, filters);
    res.json({ data, total: data.length });
  } catch (err) {
    next(err);
  }
}

export async function createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const data = createTransactionSchema.parse(req.body);
    const row = await financeRepo.createTransaction(user.id, data);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
}

export async function updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const patch = updateTransactionSchema.parse(req.body);
    const row = await financeRepo.updateTransaction(user.id, req.params.id as string, patch);
    res.json(row);
  } catch (err) {
    next(err);
  }
}

export async function deleteTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    await financeRepo.deleteTransaction(user.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { type } = monthQuerySchema.pick({ type: true }).parse(req.query);
    const data = await financeRepo.listCategories(user.id, type);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { month } = monthQuerySchema.required({ month: true }).parse(req.query);
    const [transactions, plans, balance] = await Promise.all([
      financeRepo.listTransactions(user.id, { month }),
      financeRepo.listMonthlyPlans(user.id, month),
      financeRepo.getMonthlyBalance(user.id, month),
    ]);

    res.json({ transactions, plans, balance });
  } catch (err) {
    next(err);
  }
}
