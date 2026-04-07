import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { listBudgets, createBudget, updateBudget, deleteBudget } from "../controllers/budget.controller";

const router = Router();

router.use(authenticate);

router.get("/", listBudgets);
router.post("/", createBudget);
router.patch("/:id", updateBudget);
router.delete("/:id", deleteBudget);

export default router;
