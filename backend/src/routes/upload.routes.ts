import { Router, RequestHandler } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { uploadRateLimiter } from "../middleware/rateLimiter.middleware";
import {
  upload,
  uploadCSV,
  streamJob,
  getStagingRows,
  correctCategory,
  skipStagingRow,
  confirmBatch,
  discardBatch,
} from "../controllers/upload.controller";

const router = Router();
const uploadLimiter = uploadRateLimiter as unknown as RequestHandler;

// SSE endpoint handles its own auth via query param (EventSource can't set headers)
// — must be registered before the authenticate middleware
router.get("/jobs/:jobId/stream", streamJob as unknown as RequestHandler);

router.use(authenticate);

router.post("/csv", uploadLimiter, upload.single("file"), uploadCSV);
router.get("/:batchId/staging", getStagingRows);
router.patch("/:batchId/staging/:id", correctCategory);
router.delete("/:batchId/staging/:id", skipStagingRow);
router.post("/:batchId/confirm", confirmBatch);
router.delete("/:batchId", discardBatch);

export default router;
