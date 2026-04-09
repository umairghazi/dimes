import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { CategoryService } from "../services/category.service";
import { CategoryRepository } from "../repositories/category.repository";
import { ExpenseRepository } from "../repositories/expense.repository";
import { AppError } from "../errors/AppError";

const categoryService = new CategoryService(new CategoryRepository(), new ExpenseRepository());

const createSchema = z.object({
  name: z.string().min(1),
  group: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  group: z.string().nullable().optional(),
});

function requireUser(req: Request) {
  if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  return req.user;
}

export async function getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const categories = await categoryService.getCategories(user.id);
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

export async function getAllCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const categories = await categoryService.getAllCategories(user.id);
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

export async function restoreCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const category = await categoryService.restoreCategory(user.id, req.params.id);
    res.json(category);
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const data = createSchema.parse(req.body);
    const category = await categoryService.createCategory(user.id, data);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const data = updateSchema.parse(req.body);
    const category = await categoryService.updateCategory(user.id, req.params.id, data);
    res.json(category);
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    await categoryService.deleteCategory(user.id, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
