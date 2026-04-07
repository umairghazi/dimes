export interface StagingExpense {
  id: string;
  userId: string;
  uploadBatchId: string;
  date: string;
  description: string;
  amount: number;
  aiSuggestedCategory: string;
  aiConfidence: number;
  userCorrectedCategory?: string;
  status: "pending" | "confirmed" | "rejected";
  createdAt: string;
}
