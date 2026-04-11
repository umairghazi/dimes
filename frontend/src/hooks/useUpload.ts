import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadApi } from "@/api/upload.api";
import { StagingExpense } from "@/types/upload.types";
import { usePreferencesStore } from "@/store/preferencesStore";

export type UploadStep = "map" | "processing" | "review" | "done";

export function useUpload() {
  const { currency } = usePreferencesStore();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<UploadStep>("map");
  const [batchId, setBatchId] = useState<string | null>(null);
  const [stagingRows, setStagingRows] = useState<StagingExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ classified: number; total: number } | null>(null);

  const sseCleanup = useRef<(() => void) | null>(null);

  const uploadCSV = async (
    file: File,
    dateIndex: number,
    debitIndex: number,
    creditIndex: number,
    descriptionIndex: number,
    hasHeader: boolean,
  ) => {
    setLoading(true);
    setError(null);
    setProgress(null);
    try {
      const { batchId: id, jobId, count } = await uploadApi.uploadCSV(
        file, dateIndex, debitIndex, creditIndex, descriptionIndex, hasHeader,
      );
      setBatchId(id);
      setProgress({ classified: 0, total: count });
      setStep("processing");

      sseCleanup.current = uploadApi.streamJob(
        jobId,
        (e) => setProgress({ classified: e.classified, total: e.total }),
        async (e) => {
          setAiAvailable(e.aiAvailable);
          const rows = await uploadApi.getStagingRows(id);
          setStagingRows(rows);
          setStep("review");
        },
        (msg) => {
          setError(msg);
          setStep("map");
        },
      );
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const skipRow = async (rowId: string) => {
    if (!batchId) return;
    await uploadApi.skipStagingRow(batchId, rowId);
    setStagingRows((rows) => rows.filter((r) => r.id !== rowId));
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
      await uploadApi.confirmBatch(batchId, currency);
      void queryClient.invalidateQueries({ queryKey: ["analytics"] });
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setStep("done");
    } catch {
      setError("Import failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const discard = async () => {
    if (!batchId) return;
    sseCleanup.current?.();
    await uploadApi.discardBatch(batchId);
    reset();
  };

  const reset = () => {
    sseCleanup.current?.();
    setStep("map");
    setBatchId(null);
    setStagingRows([]);
    setError(null);
    setAiAvailable(false);
    setProgress(null);
  };

  return {
    step, batchId, stagingRows, loading, error, aiAvailable, progress,
    uploadCSV, correctCategory, skipRow, confirm, discard, reset,
  };
}
