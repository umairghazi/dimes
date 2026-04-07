import { Router, RequestHandler } from "express";
import { register, login, refresh, logout } from "../controllers/auth.controller";
import { authRateLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();
const limiter = authRateLimiter as unknown as RequestHandler;

router.post("/register", limiter, register);
router.post("/login", limiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
