import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Box,
  InputAdornment,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { CategorySelect } from "@/components/shared/CategorySelect";
import { Expense } from "@/types/expense.types";
import { expensesApi } from "@/api/expenses.api";

interface ExpenseEditDialogProps {
  expense: Expense | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ExpenseEditDialog({ expense, onClose, onSaved }: ExpenseEditDialogProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (expense) {
      setDescription(expense.description);
      setAmount(String(expense.amount));
      setDate(expense.date.split("T")[0]);
      setCategory(expense.category);
    }
  }, [expense]);

  const handleSave = async () => {
    if (!expense || !description.trim() || !amount || !date) return;
    setSaving(true);
    try {
      await expensesApi.update(expense.id, {
        description: description.trim(),
        amount: parseFloat(amount),
        date,
        category,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!expense} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Expense</DialogTitle>
      <DialogContent sx={{ pt: "16px !important" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            autoFocus
          />
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoneyIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
              htmlInput: { min: 0 },
            }}
          />
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <CategorySelect
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as string)}
            />
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          disabled={saving || !description.trim() || !amount || !date}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
