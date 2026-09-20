import { FinanceCategory } from "@/api/finance.api";

export function categoryLabel(category: FinanceCategory): string {
  const source = category.path.length > 0 ? category.path : [{ id: category.id, name: category.name }];
  return source.map((part) => part.name.trim()).filter(Boolean).join(" -> ") || category.name;
}
