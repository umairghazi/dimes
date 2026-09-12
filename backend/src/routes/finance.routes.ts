import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createCategory,
  createCategoryGroup,
  createTransaction,
  deleteCategory,
  deleteCategoryGroup,
  deleteTransaction,
  getMonthlyBalance,
  getSummary,
  importTransactions,
  listCategoryGroups,
  listMonthlyPlans,
  listCategories,
  listTransactions,
  updateCategory,
  updateCategoryGroup,
  updateTransaction,
} from "../controllers/finance.controller";

const router = Router();

router.get("/transactions", authenticate, listTransactions);
router.post("/transactions/import", authenticate, importTransactions);
router.post("/transactions", authenticate, createTransaction);
router.patch("/transactions/:id", authenticate, updateTransaction);
router.delete("/transactions/:id", authenticate, deleteTransaction);
router.get("/category-groups", authenticate, listCategoryGroups);
router.post("/category-groups", authenticate, createCategoryGroup);
router.patch("/category-groups/:id", authenticate, updateCategoryGroup);
router.delete("/category-groups/:id", authenticate, deleteCategoryGroup);
router.get("/categories", authenticate, listCategories);
router.post("/categories", authenticate, createCategory);
router.patch("/categories/:id", authenticate, updateCategory);
router.delete("/categories/:id", authenticate, deleteCategory);
router.get("/plans", authenticate, listMonthlyPlans);
router.get("/balance", authenticate, getMonthlyBalance);
router.get("/summary", authenticate, getSummary);

export default router;
