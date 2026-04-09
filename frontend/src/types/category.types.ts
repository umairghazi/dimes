export interface UserCategory {
  id: string;
  userId: string;
  name: string;
  group: string | null;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryGroup {
  group: string | null;
  items: UserCategory[];
}
