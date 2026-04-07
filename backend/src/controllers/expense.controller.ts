import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ExpenseService } from "../services/expense.service";
import { ExpenseRepository } from "../repositories/expense.repository";
import { AppError } from "../errors/AppError";
const expenseService = new ExpenseService(new ExpenseRepository());

const createSchema = z.object({
  date: z.string(),
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  category: z.string().min(1),
  subCategory: z.string().optional(),
  merchantName: z.string().optional(),
  source: z.enum(["manual", "csv-upload"]).default("manual"),
  isRecurring: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

const updateSchema = createSchema.partial().omit({ source: true });

const filterSchema = z.object({
  category: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  source: z.string().optional(),
  isRecurring: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

function requireUser(req: Request): { id: string; email: string } {
  if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  return req.user;
}

export async function listExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { page, limit, category, dateFrom, dateTo, source, isRecurring } = filterSchema.parse(req.query);
    const result = await expenseService.getExpenses(
      user.id,
      {
        category,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        source,
        isRecurring: isRecurring === undefined ? undefined : isRecurring === "true",
      },
      page,
      limit,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const expense = await expenseService.getExpenseById(user.id, req.params.id);
    res.json(expense);
  } catch (err) {
    next(err);
  }
}

export async function createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const dto = createSchema.parse(req.body);
    const expense = await expenseService.createExpense(user.id, dto);
    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
}

export async function updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const dto = updateSchema.parse(req.body);
    const expense = await expenseService.updateExpense(user.id, req.params.id, dto);
    res.json(expense);
  } catch (err) {
    next(err);
  }
}

export async function deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    await expenseService.deleteExpense(user.id, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
