import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createCategory,
  createTransaction,
  deleteCategory,
  deleteTransaction,
  getSummary,
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
router.get("/summary", authenticate, getSummary);

export default router;
