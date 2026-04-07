import { apiClient } from "./client";
import { StagingExpense } from "@/types/upload.types";

export const uploadApi = {
  uploadCSV: (file: File, dateIndex: number, debitIndex: number, creditIndex: number, descriptionIndex: number, hasHeader: boolean) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dateIndex", String(dateIndex));
    formData.append("debitIndex", String(debitIndex));
    formData.append("creditIndex", String(creditIndex));
    formData.append("descriptionIndex", String(descriptionIndex));
    formData.append("hasHeader", String(hasHeader));
    return apiClient
      .post<{ batchId: string; count: number; aiAvailable: boolean }>("/upload/csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
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

  discardBatch: (batchId: string) =>
    apiClient.delete(`/upload/${batchId}`),
};
