import { apiClient } from "./client";
import { StagingExpense } from "@/types/upload.types";

export const uploadApi = {
  uploadCSV: (file: File, dateColumn: string, amountColumn: string, descriptionColumn: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dateColumn", dateColumn);
    formData.append("amountColumn", amountColumn);
    formData.append("descriptionColumn", descriptionColumn);
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

  discardBatch: (batchId: string) =>
    apiClient.delete(`/upload/${batchId}`),
};
