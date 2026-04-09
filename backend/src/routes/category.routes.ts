import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
} from "../controllers/category.controller";

const router = Router();
router.use(authenticate);

router.get("/", getCategories);
router.get("/all", getAllCategories);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);
router.post("/:id/restore", restoreCategory);

export default router;
