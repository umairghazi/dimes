export interface UserCategory {
  id: string;
  userId: string;
  name: string;
  group: string | null;
  type: "expense" | "income" | null;
  isFixed: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
