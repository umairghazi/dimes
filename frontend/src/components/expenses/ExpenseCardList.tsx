import { useState } from "react";
import { formatDate } from "@/lib/date";
import { Box, Card, CardContent, Typography, IconButton, Skeleton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Expense } from "@/types/expense.types";
import { expensesApi } from "@/api/expenses.api";
import { CategoryEditCell } from "./CategoryEditCell";
import { ExpenseEditDialog } from "./ExpenseEditDialog";

interface ExpenseCardListProps {
  expenses: Expense[];
  loading: boolean;
  onUpdate: () => void;
}

export function ExpenseCardList({ expenses, loading, onUpdate }: ExpenseCardListProps) {
  const [editTarget, setEditTarget] = useState<Expense | null>(null);

  const handleDelete = async (id: string) => {
    await expensesApi.delete(id);
    onUpdate();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  if (expenses.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
        No expenses found
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {expenses.map((expense) => (
        <Card key={expense.id}>
          <CardContent sx={{ py: "12px !important", px: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {expense.description}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 0.5, alignItems: "center" }}>
                  <CategoryEditCell
                    expenseId={expense.id}
                    category={expense.category}
                    categoryId={expense.categoryId ?? null}
                    onUpdated={onUpdate}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(expense.date)}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography
                  sx={{ fontWeight: 700 }}
                  color={expense.type === "income" ? "success.main" : "inherit"}
                >
                  ${expense.amount.toFixed(2)}
                </Typography>
                <IconButton size="small" onClick={() => setEditTarget(expense)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => void handleDelete(expense.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
      <ExpenseEditDialog
        expense={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => { setEditTarget(null); onUpdate(); }}
      />
    </Box>
  );
}
