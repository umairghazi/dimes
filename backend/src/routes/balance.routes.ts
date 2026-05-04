import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getBalance, upsertBalance } from "../controllers/balance.controller";

const router = Router();

router.use(authenticate);

router.get("/", getBalance);
router.put("/", upsertBalance);

export default router;
