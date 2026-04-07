import { Router, RequestHandler } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { nlQueryRateLimiter } from "../middleware/rateLimiter.middleware";
import { nlQuery } from "../controllers/query.controller";

const router = Router();
const limiter = nlQueryRateLimiter as unknown as RequestHandler;

router.use(authenticate);
router.post("/nl", limiter, nlQuery);

export default router;
