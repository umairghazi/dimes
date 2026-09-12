import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createCategory,
  createTransaction,
  deleteCategory,
  deleteTransaction,
  getMonthlyBalance,
  getSummary,
  listMonthlyPlans,
  listCategories,
  listTransactions,
  updateCategory,
  updateTransaction,
} from "../controllers/finance.controller";

const router = Router();

router.get("/transactions", authenticate, listTransactions);
router.post("/transactions", authenticate, createTransaction);
router.patch("/transactions/:id", authenticate, updateTransaction);
router.delete("/transactions/:id", authenticate, deleteTransaction);
router.get("/categories", authenticate, listCategories);
router.post("/categories", authenticate, createCategory);
router.patch("/categories/:id", authenticate, updateCategory);
router.delete("/categories/:id", authenticate, deleteCategory);
router.get("/plans", authenticate, listMonthlyPlans);
router.get("/balance", authenticate, getMonthlyBalance);
router.get("/summary", authenticate, getSummary);

export default router;
