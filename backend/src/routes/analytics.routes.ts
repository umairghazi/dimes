import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getSummary, getTrends, getRecurring, getInsight, getBudgetComparison, getIncomeBreakdown } from "../controllers/analytics.controller";

const router = Router();

router.use(authenticate);

router.get("/summary", getSummary);
router.get("/trends", getTrends);
router.get("/recurring", getRecurring);
router.get("/insight", getInsight);
router.get("/budget-comparison", getBudgetComparison);
router.get("/income-breakdown", getIncomeBreakdown);

export default router;
