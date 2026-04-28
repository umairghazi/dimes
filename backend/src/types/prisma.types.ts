// Local type definitions matching the Prisma schema.
// These are used until `prisma generate` is run against a live MongoDB connection.
// After running prisma generate, you can import directly from "@prisma/client".

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  dataEncryptionKeyId: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: Record<string, unknown>;
}

export interface Expense {
  id: string;
  userId: string;
  date: Date;
  description: string;
  amount: number;
  currency: string;
  categoryId?: string | null;
  type: string; // "expense" | "income"
  subCategory?: string | null;
  merchantName?: string | null;
  source: string;
  isRecurring: boolean;
  tags: string[];
  originalDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StagingExpense {
  id: string;
  userId: string;
  uploadBatchId: string;
  date: Date;
  description: string;
  amount: number;
  aiSuggestedCategory: string;
  aiConfidence: number;
  userCorrectedCategory?: string | null;
  classificationSource?: string | null;
  status: string;
  createdAt: Date;
}

export interface UserCategory {
  id: string;
  userId: string;
  name: string;
  group: string | null;
  type: string | null; // "expense" | "income" — null treated as "expense"
  isFixed: boolean;
  sortOrder: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  monthYear: string;
  limitAmount: number;
  currency: string;
  alertThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}
