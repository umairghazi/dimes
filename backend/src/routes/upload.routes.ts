import { Router, RequestHandler } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { uploadRateLimiter } from "../middleware/rateLimiter.middleware";
import {
  upload,
  uploadCSV,
  getStagingRows,
  correctCategory,
  confirmBatch,
  discardBatch,
} from "../controllers/upload.controller";

const router = Router();
const uploadLimiter = uploadRateLimiter as unknown as RequestHandler;

router.use(authenticate);

router.post("/csv", uploadLimiter, upload.single("file"), uploadCSV);
router.get("/:batchId/staging", getStagingRows);
router.patch("/:batchId/staging/:id", correctCategory);
router.post("/:batchId/confirm", confirmBatch);
router.delete("/:batchId", discardBatch);

export default router;
