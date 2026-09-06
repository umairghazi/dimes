import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createTransaction,
  deleteTransaction,
  getSummary,
  listCategories,
  listTransactions,
  updateTransaction,
} from "../controllers/finance.controller";

const router = Router();

router.get("/transactions", authenticate, listTransactions);
router.post("/transactions", authenticate, createTransaction);
router.patch("/transactions/:id", authenticate, updateTransaction);
router.delete("/transactions/:id", authenticate, deleteTransaction);
router.get("/categories", authenticate, listCategories);
router.get("/summary", authenticate, getSummary);

export default router;
