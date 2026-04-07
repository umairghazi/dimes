import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../controllers/expense.controller";

const router = Router();

router.use(authenticate);

router.get("/", listExpenses);
router.get("/:id", getExpense);
router.post("/", createExpense);
router.patch("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;
