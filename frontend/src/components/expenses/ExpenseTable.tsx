import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Skeleton,
  Typography,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Expense } from "@/types/expense.types";
import { expensesApi } from "@/api/expenses.api";
import { CategoryEditCell } from "./CategoryEditCell";
import { ExpenseEditDialog } from "./ExpenseEditDialog";

interface ExpenseTableProps {
  expenses: Expense[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onUpdate: () => void;
}

export function ExpenseTable({
  expenses,
  loading,
  page,
  totalPages,
  onPageChange,
  onUpdate,
}: ExpenseTableProps) {
  const [editTarget, setEditTarget] = useState<Expense | null>(null);

  const handleDelete = async (id: string) => {
    await expensesApi.delete(id);
    onUpdate();
  };

  return (
    <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Source</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No expenses found</Typography>
                    </TableCell>
                  </TableRow>
                )
              : expenses.map((expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{expense.description}</Typography>
                        {expense.merchantName && (
                          <Typography variant="caption" color="text.secondary">
                            {expense.merchantName}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <CategoryEditCell
                        expenseId={expense.id}
                        category={expense.category}
                        onUpdated={onUpdate}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{ fontWeight: 600 }}
                        color={expense.category === "Income" ? "success.main" : "inherit"}
                      >
                        ${expense.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={expense.source === "csv-upload" ? "CSV" : "Manual"}
                        size="small"
                        color={expense.source === "csv-upload" ? "default" : "primary"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" sx={{ mr: 0.5 }} onClick={() => setEditTarget(expense)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => void handleDelete(expense.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalPages * 20}
        page={page - 1}
        rowsPerPage={20}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
        rowsPerPageOptions={[20]}
      />
      <ExpenseEditDialog
        expense={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => { setEditTarget(null); onUpdate(); }}
      />
    </Paper>
  );
}
