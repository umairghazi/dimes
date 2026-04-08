import { apiClient } from "./client";
import { useAuthStore } from "@/store/authStore";
import { StagingExpense } from "@/types/upload.types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export interface JobProgressEvent {
  classified: number;
  total: number;
}

export interface JobDoneEvent {
  classified: number;
  total: number;
  aiAvailable: boolean;
}

export const uploadApi = {
  uploadCSV: (
    file: File,
    dateIndex: number,
    debitIndex: number,
    creditIndex: number,
    descriptionIndex: number,
    hasHeader: boolean,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dateIndex", String(dateIndex));
    formData.append("debitIndex", String(debitIndex));
    formData.append("creditIndex", String(creditIndex));
    formData.append("descriptionIndex", String(descriptionIndex));
    formData.append("hasHeader", String(hasHeader));
    return apiClient
      .post<{ batchId: string; jobId: string; count: number }>("/upload/csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  streamJob: (
    jobId: string,
    onProgress: (e: JobProgressEvent) => void,
    onDone: (e: JobDoneEvent) => void,
    onError: (msg: string) => void,
  ): (() => void) => {
    const token = useAuthStore.getState().accessToken ?? "";
    const url = `${BASE_URL}/upload/jobs/${jobId}/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    let completed = false;

    es.addEventListener("progress", (e) => {
      onProgress(JSON.parse(e.data) as JobProgressEvent);
    });
    es.addEventListener("done", (e) => {
      completed = true;
      onDone(JSON.parse(e.data) as JobDoneEvent);
      es.close();
    });
    es.addEventListener("error", (e) => {
      // Ignore the connection-close error that fires right after the server
      // ends the stream following the "done" event
      if (completed) return;
      if ("data" in e && (e as MessageEvent).data) {
        const { message } = JSON.parse((e as MessageEvent).data) as { message: string };
        onError(message);
      } else {
        onError("Connection lost");
      }
      es.close();
    });

    return () => es.close();
  },

  getStagingRows: (batchId: string) =>
    apiClient.get<StagingExpense[]>(`/upload/${batchId}/staging`).then((r) => r.data),

  correctCategory: (batchId: string, rowId: string, category: string) =>
    apiClient
      .patch<StagingExpense>(`/upload/${batchId}/staging/${rowId}`, { category })
      .then((r) => r.data),

  confirmBatch: (batchId: string) =>
    apiClient.post<{ imported: number }>(`/upload/${batchId}/confirm`).then((r) => r.data),

  skipStagingRow: (batchId: string, rowId: string) =>
    apiClient.delete(`/upload/${batchId}/staging/${rowId}`),

  discardBatch: (batchId: string) => apiClient.delete(`/upload/${batchId}`),
};
