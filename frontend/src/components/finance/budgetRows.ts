import { FinanceCategory, MonthlyPlan } from "@/api/finance.api";
import { Expense, expenseAmount } from "@/types/expense.types";
import { categoryLabel } from "./categoryLabels";

export interface SummaryRow {
  key: string;
  categoryId: string | null;
  category: string;
  planName?: string;
  planned: number;
  actual: number;
  spent: number;
  refunded: number;
  diff: number;
  path: Array<{ id: string; name: string }>;
}

export function buildRows(transactions: Expense[], plans: MonthlyPlan[], type: "expense" | "income", categories: FinanceCategory[] = []): SummaryRow[] {
  const typedCategories = categories.filter((category) => category.type === type);
  const byId = new Map(typedCategories.map((category) => [category.id, category]));
  const rows = new Map<string, SummaryRow>();
  const ensure = (id: string | null, fallback: string): SummaryRow => {
    const key = id ?? `unlinked:${fallback}`;
    const existing = rows.get(key);
    if (existing) return existing;
    const category = id ? byId.get(id) : undefined;
    const row = { key, categoryId: id, category: category ? categoryLabel(category) : fallback, planned: 0, actual: 0, spent: 0, refunded: 0, diff: 0, path: category?.path ?? [] };
    rows.set(key, row);
    return row;
  };

  // Keep unused leaves available in the plan editor; parents appear only with direct activity or plans.
  typedCategories.filter((category) => !category.hasChildren).forEach((category) => ensure(category.id, category.name));
  transactions.filter((row) => type === "expense" ? row.type !== "income" : row.type === "income").forEach((transaction) => {
    const row = ensure(transaction.categoryId ?? null, transaction.category);
    row.actual += type === "expense" ? expenseAmount(transaction) : transaction.amount;
    if (transaction.type === "expense") row.spent += transaction.amount;
    if (transaction.type === "expense_refund") row.refunded += transaction.amount;
  });
  plans.filter((plan) => plan.type === type).forEach((plan) => {
    // Legacy name-only plans may resolve only when the name is unambiguous.
    const matches = typedCategories.filter((category) => category.name === plan.categoryName || categoryLabel(category) === plan.categoryName);
    const id = plan.categoryId ?? (matches.length === 1 ? matches[0].id : null);
    const row = ensure(id, plan.categoryName);
    row.planned += plan.plannedAmount;
    row.planName = plan.categoryName;
  });
  return [...rows.values()].map((row) => ({ ...row, diff: type === "expense" ? row.planned - row.actual : row.actual - row.planned }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export function budgetTreeRows(rows: SummaryRow[]): Array<SummaryRow & { depth: number; label: string }> {
  type TreeNode = SummaryRow & { depth: number; label: string; parentKey: string | null };
  const nodes = new Map<string, TreeNode>();
  rows.forEach((row) => {
    const path = row.path.length ? row.path : [{ id: row.key, name: row.category }];
    path.forEach((part, depth) => {
      let node = nodes.get(part.id);
      if (!node) {
        node = { ...row, key: part.id, categoryId: part.id, category: part.name, label: part.name, depth,
          path: path.slice(0, depth + 1), parentKey: depth ? path[depth - 1].id : null, planned: 0, actual: 0, spent: 0, refunded: 0, diff: 0 };
        nodes.set(part.id, node);
      }
      node.planned += row.planned;
      node.actual += row.actual;
      node.spent += row.spent;
      node.refunded += row.refunded;
      node.diff += row.diff;
    });
  });
  const children = new Map<string | null, TreeNode[]>();
  nodes.forEach((node) => {
    const siblings = children.get(node.parentKey) ?? [];
    siblings.push(node);
    children.set(node.parentKey, siblings);
  });
  const result: Array<SummaryRow & { depth: number; label: string }> = [];
  const visit = (parent: string | null) => {
    const siblings = children.get(parent) ?? [];
    siblings.sort((a, b) => b.actual - a.actual || a.label.localeCompare(b.label));
    siblings.forEach((node) => { result.push(node); visit(node.key); });
  };
  visit(null);
  return result;
}
