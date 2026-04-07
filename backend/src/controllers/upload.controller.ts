import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import multer from "multer";
import { UploadService } from "../services/upload.service";
import { StagingRepository } from "../repositories/staging.repository";
import { ExpenseRepository } from "../repositories/expense.repository";
import { ClassificationRepository } from "../repositories/classification.repository";
import { AppError } from "../errors/AppError";
import { EXPENSE_CATEGORIES } from "../types/common.types";

const uploadService = new UploadService(
  new StagingRepository(),
  new ExpenseRepository(),
  new ClassificationRepository(),
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
  dateColumn: z.string(),
  amountColumn: z.string(),
  descriptionColumn: z.string(),
});

const correctSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES as [string, ...string[]]),
});

function requireUser(req: Request) {
  if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  return req.user;
}

export async function uploadCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    if (!req.file) throw new AppError("No file uploaded", 400, "NO_FILE");
    const { dateColumn, amountColumn, descriptionColumn } = mappingSchema.parse(req.body);
    const result = await uploadService.processCSV(user.id, req.file.buffer, {
      date: dateColumn,
      amount: amountColumn,
      description: descriptionColumn,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
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

export async function discardBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    await uploadService.discardBatch(user.id, req.params.batchId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
