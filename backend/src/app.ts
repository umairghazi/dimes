import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { errorMiddleware } from "./middleware/error.middleware";
import { authenticate } from "./middleware/auth.middleware";
import { cache } from "./lib/cache";

import authRoutes from "./routes/auth.routes";
import expenseRoutes from "./routes/expense.routes";
import uploadRoutes from "./routes/upload.routes";
import budgetRoutes from "./routes/budget.routes";
import analyticsRoutes from "./routes/analytics.routes";
import queryRoutes from "./routes/query.routes";
import categoryRoutes from "./routes/category.routes";
import balanceRoutes from "./routes/balance.routes";

const app = express();

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
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.post("/cache/flush", authenticate, (_req, res) => {
  const before = cache.size;
  cache.flush();
  res.json({ flushed: before });
});

app.use("/auth", authRoutes);
app.use("/expenses", expenseRoutes);
app.use("/upload", uploadRoutes);
app.use("/budgets", budgetRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/query", queryRoutes);
app.use("/categories", categoryRoutes);
app.use("/balance", balanceRoutes);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(errorMiddleware as any);

export default app;
