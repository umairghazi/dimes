import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { createFinanceContext } from "../middleware/financeContext.middleware";
import {
  createCategory,
  createTransaction,
  deleteCategory,
  deleteTransaction,
  getMonthlyBalance,
  getDateRangeSummary,
  getSummary,
  getYearlySummary,
  importTransactions,
  listMonthlyPlans,
  listCategories,
  listTransactions,
  updateCategory,
  deleteMonthlyPlan,
  upsertMonthlyBalance,
  upsertMonthlyPlan,
  updateTransaction,
} from "../controllers/finance.controller";

const router = Router();

router.use(authenticate, createFinanceContext);

router.get("/transactions", listTransactions);
router.post("/transactions/import", importTransactions);
router.post("/transactions", createTransaction);
router.patch("/transactions/:id", updateTransaction);
router.delete("/transactions/:id", deleteTransaction);
router.get("/categories", listCategories);
router.post("/categories", createCategory);
router.patch("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);
router.get("/plans", listMonthlyPlans);
router.put("/plans", upsertMonthlyPlan);
router.delete("/plans/:id", deleteMonthlyPlan);
router.get("/balance", getMonthlyBalance);
router.put("/balance", upsertMonthlyBalance);
router.get("/summary", getSummary);
router.get("/yearly-summary", getYearlySummary);
router.get("/range-summary", getDateRangeSummary);

export default router;
