import rateLimit from "express-rate-limit";

export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: "Too many upload requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const nlQueryRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: "Too many query requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many auth requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
