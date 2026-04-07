import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";

const router = Router();
router.use(authenticate);

router.get("/", getCategories);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
