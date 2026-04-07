import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";

import authRoutes from "./routes/auth.routes";
import expenseRoutes from "./routes/expense.routes";
import uploadRoutes from "./routes/upload.routes";
import budgetRoutes from "./routes/budget.routes";
import analyticsRoutes from "./routes/analytics.routes";
import queryRoutes from "./routes/query.routes";
import categoryRoutes from "./routes/category.routes";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/expenses", expenseRoutes);
app.use("/upload", uploadRoutes);
app.use("/budgets", budgetRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/query", queryRoutes);
app.use("/categories", categoryRoutes);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(errorMiddleware as any);

export default app;
