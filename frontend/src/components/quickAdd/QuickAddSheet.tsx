import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Typography,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Chip,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { CategorySelect } from "@/components/shared/CategorySelect";
import { expensesApi } from "@/api/expenses.api";
import { queryApi } from "@/api/query.api";
import { tokens } from "@/styles/theme/tokens";

interface QuickAddSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const today = () => new Date().toISOString().split("T")[0];

export function QuickAddSheet({ open, onClose, onSaved }: QuickAddSheetProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today());
  const [category, setCategory] = useState("Groceries");
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setAmount("");
      setDescription("");
      setDate(today());
      setCategory("Groceries");
      setSuggestedCategory(null);
    }
  }, [open]);

  // Real-time AI category suggestion debounced 400ms
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (description.length < 3) { setSuggestedCategory(null); return; }

    debounceTimer.current = setTimeout(async () => {
      try {
        const result = await queryApi.nl(`categorize: ${description}`, "ask");
        if (result.parsedTransaction?.category) {
          setSuggestedCategory(result.parsedTransaction.category);
        }
      } catch {
        // silently ignore
      }
    }, 400);

    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [description]);

  const handleSave = async () => {
    if (!amount || !description) return;
    setSaving(true);
    try {
      await expensesApi.create({
        amount: parseFloat(amount),
        description,
        date,
        category: category as import("@/types/expense.types").ExpenseCategory,
        currency: "USD",
        source: "manual",
        isRecurring: false,
        tags: [],
      });
      onSaved?.();
      onClose();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
      <TextField
        label="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        autoFocus
        inputProps={{ inputMode: "decimal" }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <AttachMoneyIcon />
            </InputAdornment>
          ),
        }}
        fullWidth
      />
      <TextField
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        placeholder="e.g. Coffee at Starbucks"
      />
      {suggestedCategory && suggestedCategory !== category && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="caption" color="text.secondary">AI suggests:</Typography>
          <Chip
            label={suggestedCategory}
            size="small"
            color="primary"
            variant="outlined"
            onClick={() => setCategory(suggestedCategory)}
          />
        </Box>
      )}
      <FormControl fullWidth>
        <InputLabel>Category</InputLabel>
        <CategorySelect
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as string)}
        />
      </FormControl>
      <TextField
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        fullWidth
        InputLabelProps={{ shrink: true }}
      />
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderTopLeftRadius: tokens.radii.xl,
            borderTopRightRadius: tokens.radii.xl,
            p: 3,
            pb: 4,
          },
        }}
      >
        <Typography variant="h6" fontWeight={600} mb={2}>Add Transaction</Typography>
        {content}
        <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
          <Button fullWidth variant="outlined" onClick={onClose}>Cancel</Button>
          <Button fullWidth variant="contained" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Transaction</DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
