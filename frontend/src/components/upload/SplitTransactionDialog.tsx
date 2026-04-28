import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  IconButton,
  Typography,
  Alert,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { CategorySelect } from "@/components/shared/CategorySelect";
import { StagingExpense } from "@/types/upload.types";

interface SplitRow {
  description: string;
  amount: string;
  category: string;
}

interface SplitTransactionDialogProps {
  open: boolean;
  row: StagingExpense | null;
  onClose: () => void;
  onConfirm: (splits: { description: string; amount: number; category: string }[]) => void;
}

function makeSplitRow(description: string, amount: string, category: string): SplitRow {
  return { description, amount, category };
}

export function SplitTransactionDialog({ open, row, onClose, onConfirm }: SplitTransactionDialogProps) {
  const [splits, setSplits] = useState<SplitRow[]>([]);

  useEffect(() => {
    if (open && row) {
      const half = (row.amount / 2).toFixed(2);
      const category = row.userCorrectedCategory ?? row.aiSuggestedCategory ?? "";
      setSplits([
        makeSplitRow(row.description, half, category),
        makeSplitRow(row.description, half, category),
      ]);
    }
  }, [open, row]);

  const originalAmount = row?.amount ?? 0;

  const totalAllocated = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const remaining = parseFloat((originalAmount - totalAllocated).toFixed(2));
  const isValid =
    splits.every((s) => s.description.trim() && s.category && parseFloat(s.amount) > 0) &&
    Math.abs(remaining) <= 0.01;

  const update = (index: number, field: keyof SplitRow, value: string) => {
    setSplits((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addRow = () => {
    const category = row?.userCorrectedCategory ?? row?.aiSuggestedCategory ?? "";
    setSplits((prev) => [...prev, makeSplitRow(row?.description ?? "", "", category)]);
  };

  const removeRow = (index: number) => {
    setSplits((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    onConfirm(
      splits.map((s) => ({
        description: s.description.trim(),
        amount: parseFloat(s.amount),
        category: s.category,
      })),
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Split Transaction</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Original: <strong>{row?.description}</strong> — ${originalAmount.toFixed(2)}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {splits.map((split, i) => (
            <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
              <TextField
                label="Description"
                value={split.description}
                onChange={(e) => update(i, "description", e.target.value)}
                size="small"
                sx={{ flex: 2 }}
              />
              <TextField
                label="Amount"
                value={split.amount}
                onChange={(e) => update(i, "amount", e.target.value)}
                size="small"
                type="number"
                sx={{ flex: 1 }}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                  htmlInput: { min: 0, step: "0.01" },
                }}
              />
              <CategorySelect
                value={split.category}
                onChange={(e) => update(i, "category", e.target.value as string)}
                size="small"
                valueBy="name"
                displayEmpty
                sx={{ flex: 2 }}
              />
              <IconButton
                size="small"
                onClick={() => removeRow(i)}
                disabled={splits.length <= 2}
                sx={{ mt: 0.5 }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Button startIcon={<AddIcon />} size="small" onClick={addRow}>
            Add row
          </Button>
          <Typography
            variant="body2"
            color={Math.abs(remaining) <= 0.01 ? "success.main" : remaining < 0 ? "error" : "warning.main"}
            sx={{ fontWeight: 600 }}
          >
            {Math.abs(remaining) <= 0.01
              ? "Fully allocated"
              : remaining > 0
                ? `$${remaining.toFixed(2)} unallocated`
                : `$${Math.abs(remaining).toFixed(2)} over`}
          </Typography>
        </Box>

        {splits.some((s) => !s.description.trim() || !s.category) && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            All rows need a description and category.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={!isValid}>
          Split
        </Button>
      </DialogActions>
    </Dialog>
  );
}
