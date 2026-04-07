export interface Budget {
  id: string;
  userId: string;
  category: string;
  monthYear: string;
  limitAmount: number;
  currency: string;
  alertThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetDto {
  category: string;
  monthYear: string;
  limitAmount: number;
  currency?: string;
  alertThreshold?: number;
}

export interface UpdateBudgetDto {
  limitAmount?: number;
  alertThreshold?: number;
}
