import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { rateLimit } from "express-rate-limit";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { errorMiddleware } from "./middleware/error.middleware";
import financeRoutes from "./routes/finance.routes";

const app = express();
app.set("trust proxy", 1);

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
});

const importRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many imports. Please try again later.", code: "RATE_LIMITED" },
});

app.use(pinoHttp({
  logger,
  customLogLevel: (_req, res) => {
    if (res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  serializers: {
    req: (req) => ({ method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
}));
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN.split(",").map((o) => o.trim()),
  }),
);
app.use(express.json({ limit: "1mb", strict: true }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/finance/transactions/import", importRateLimit);
app.use("/finance", apiRateLimit, (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use("/finance", financeRoutes);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(errorMiddleware as any);

export default app;
