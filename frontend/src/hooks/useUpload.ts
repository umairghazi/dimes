import { useState } from "react";
import { uploadApi } from "@/api/upload.api";
import { StagingExpense } from "@/types/upload.types";

export type UploadStep = "map" | "review" | "done";

export function useUpload() {
  const [step, setStep] = useState<UploadStep>("map");
  const [batchId, setBatchId] = useState<string | null>(null);
  const [stagingRows, setStagingRows] = useState<StagingExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean>(true);

  const uploadCSV = async (
    file: File,
    dateColumn: string,
    amountColumn: string,
    descriptionColumn: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const { batchId: id, aiAvailable: hasAI } = await uploadApi.uploadCSV(file, dateColumn, amountColumn, descriptionColumn);
      setBatchId(id);
      setAiAvailable(hasAI);
      const rows = await uploadApi.getStagingRows(id);
      setStagingRows(rows);
      setStep("review");
    } catch {
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const correctCategory = async (rowId: string, category: string) => {
    if (!batchId) return;
    const updated = await uploadApi.correctCategory(batchId, rowId, category);
    setStagingRows((rows) => rows.map((r) => (r.id === rowId ? updated : r)));
  };

  const confirm = async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      await uploadApi.confirmBatch(batchId);
      setStep("done");
    } catch {
      setError("Confirm failed");
    } finally {
      setLoading(false);
    }
  };

  const discard = async () => {
    if (!batchId) return;
    await uploadApi.discardBatch(batchId);
    reset();
  };

  const reset = () => {
    setStep("map");
    setBatchId(null);
    setStagingRows([]);
    setError(null);
    setAiAvailable(true);
  };

  return { step, batchId, stagingRows, loading, error, aiAvailable, uploadCSV, correctCategory, confirm, discard, reset };
}
