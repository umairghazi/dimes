import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { CategoryRepository } from "../repositories/category.repository";
import { MonthlyBalanceRepository } from "../repositories/monthlyBalance.repository";
import { MonthlyPlanRepository } from "../repositories/monthlyPlan.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { CategoryService } from "../services/category.service";
import { MonthlySummaryService } from "../services/monthlySummary.service";
import { TransactionService } from "../services/transaction.service";

export function createFinanceContext(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user || !req.supabase) {
    next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    return;
  }

  const categoryRepo = new CategoryRepository(req.supabase);
  const transactionRepo = new TransactionRepository(req.supabase);
  const monthlyPlanRepo = new MonthlyPlanRepository(req.supabase);
  const monthlyBalanceRepo = new MonthlyBalanceRepository(req.supabase);

  req.finance = {
    user: req.user,
    transactionService: new TransactionService(transactionRepo, categoryRepo),
    categoryService: new CategoryService(categoryRepo),
    monthlySummaryService: new MonthlySummaryService(
      transactionRepo,
      monthlyPlanRepo,
      monthlyBalanceRepo,
      categoryRepo,
    ),
  };

  next();
}
