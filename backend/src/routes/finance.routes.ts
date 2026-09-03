import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getFinanceStatus, listFinanceTransactions } from "../controllers/finance.controller";

const router = Router();

router.use(authenticate);

router.get("/status", getFinanceStatus);
router.get("/transactions", listFinanceTransactions);

export default router;
