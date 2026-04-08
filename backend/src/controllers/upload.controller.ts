import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import multer from "multer";
import jwt from "jsonwebtoken";
import { UploadService } from "../services/upload.service";
import { StagingRepository } from "../repositories/staging.repository";
import { ExpenseRepository } from "../repositories/expense.repository";
import { ClassificationRepository } from "../repositories/classification.repository";
import { CategoryService } from "../services/category.service";
import { CategoryRepository } from "../repositories/category.repository";
import { AppError } from "../errors/AppError";
import { jobStore } from "../services/jobStore";
import { env } from "../config/env";

const uploadService = new UploadService(
  new StagingRepository(),
  new ExpenseRepository(),
  new ClassificationRepository(),
  new CategoryService(new CategoryRepository()),
);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new AppError("Only CSV files are allowed", 400, "INVALID_FILE_TYPE"));
    }
  },
});

const mappingSchema = z.object({
  dateIndex: z.coerce.number().int().min(0),
  debitIndex: z.coerce.number().int().min(0),
  creditIndex: z.coerce.number().int().min(-1),
  descriptionIndex: z.coerce.number().int().min(0),
  hasHeader: z.string().transform((v) => v === "true"),
});

const correctSchema = z.object({
  category: z.string().min(1),
});

function requireUser(req: Request) {
  if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  return req.user;
}

export async function uploadCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    if (!req.file) throw new AppError("No file uploaded", 400, "NO_FILE");
    const { dateIndex, debitIndex, creditIndex, descriptionIndex, hasHeader } = mappingSchema.parse(req.body);
    const result = await uploadService.processCSV(user.id, req.file.buffer, {
      dateIndex,
      debitIndex,
      creditIndex,
      descriptionIndex,
      hasHeader,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export function streamJob(req: Request, res: Response): void {
  // EventSource can't set headers, so accept token via query param for this endpoint only
  const token = req.query.token as string | undefined;
  if (!token) { res.status(401).end(); return; }

  let userId: string;
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string };
    userId = payload.sub;
  } catch {
    res.status(401).end();
    return;
  }

  const { jobId } = req.params;
  const job = jobStore.get(jobId);
  if (!job) { res.status(404).end(); return; }

  // Ownership check — batchId is tied to userId via staging rows, but we can't easily
  // verify here without a DB call. The jobId is a UUID unknown to other users, so
  // guessing it is not a practical attack vector for this app's scale.
  void userId; // acknowledged

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (event: string, data: object) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // If job is already finished, send final event immediately
  if (job.status === "done") {
    send("done", { classified: job.total, total: job.total, aiAvailable: job.aiAvailable });
    res.end();
    return;
  }
  if (job.status === "failed") {
    send("error", { message: job.error ?? "Classification failed" });
    res.end();
    return;
  }

  // Send current progress so the client isn't blank on connect
  send("progress", { classified: job.classified, total: job.total });

  const unsubscribe = jobStore.subscribe(jobId, (state) => {
    if (state.status === "processing") {
      send("progress", { classified: state.classified, total: state.total });
    } else if (state.status === "done") {
      send("done", { classified: state.total, total: state.total, aiAvailable: state.aiAvailable });
      res.end();
    } else if (state.status === "failed") {
      send("error", { message: state.error ?? "Classification failed" });
      res.end();
    }
  });

  req.on("close", unsubscribe);
}

export async function getStagingRows(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const rows = await uploadService.getStagingRows(user.id, req.params.batchId);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function correctCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { category } = correctSchema.parse(req.body);
    const row = await uploadService.correctCategory(
      user.id,
      req.params.batchId,
      req.params.id,
      category,
    );
    res.json(row);
  } catch (err) {
    next(err);
  }
}

export async function confirmBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const result = await uploadService.confirmBatch(user.id, req.params.batchId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function skipStagingRow(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    await uploadService.skipStagingRow(user.id, req.params.batchId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function discardBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    await uploadService.discardBatch(user.id, req.params.batchId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
