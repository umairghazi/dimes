import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Button,
  Box,
  MenuItem,
} from "@mui/material";
import { useState } from "react";
import { CategorySelect } from "@/components/shared/CategorySelect";
import { CreateBudgetDto } from "@/types/budget.types";

interface BudgetFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (dto: Omit<CreateBudgetDto, "monthYear">) => void;
}

export function BudgetForm({ open, onClose, onSave }: BudgetFormProps) {
  const [category, setCategory] = useState("Groceries");
  const [limitAmount, setLimitAmount] = useState("");
  const [currency, setCurrency] = useState("USD");

  const handleSave = () => {
    if (!limitAmount) return;
    onSave({ category, limitAmount: parseFloat(limitAmount), currency });
    onClose();
    setLimitAmount("");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>New Budget</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <CategorySelect
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as string)}
            />
          </FormControl>
          <TextField
            label="Monthly Limit"
            type="number"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            fullWidth
            inputProps={{ min: 0 }}
          />
          <TextField
            select
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            fullWidth
          >
            {["USD", "EUR", "GBP", "CAD", "AUD"].map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
