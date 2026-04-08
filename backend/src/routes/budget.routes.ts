import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { listBudgets, createBudget, updateBudget, deleteBudget, rolloverBudgets } from "../controllers/budget.controller";

const router = Router();

router.use(authenticate);

router.get("/", listBudgets);
router.post("/", createBudget);
router.post("/rollover", rolloverBudgets);
router.patch("/:id", updateBudget);
router.delete("/:id", deleteBudget);

export default router;
