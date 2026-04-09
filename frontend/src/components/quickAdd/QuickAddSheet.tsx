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
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Chip,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { CategorySelect } from "@/components/shared/CategorySelect";

const INCOME_SOURCES = ["Paycheck", "Salary", "Bonus", "Interest", "Freelance", "Rebates", "Other"];
import { expensesApi } from "@/api/expenses.api";
import { usePreferencesStore } from "@/store/preferencesStore";
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

  const { currency } = usePreferencesStore();
  const [mode, setMode] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today());
  const [category, setCategory] = useState("Groceries");
  const [incomeSource, setIncomeSource] = useState("Paycheck");
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setMode("expense");
      setAmount("");
      setDescription("");
      setDate(today());
      setCategory("Groceries");
      setIncomeSource("Paycheck");
      setSuggestedCategory(null);
    }
  }, [open]);

  // Real-time AI category suggestion debounced 400ms (expense mode only)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (mode === "income" || description.length < 3) { setSuggestedCategory(null); return; }

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
  }, [description, mode]);

  const handleSave = async () => {
    if (!amount || !description) return;
    setSaving(true);
    try {
      await expensesApi.create({
        amount: parseFloat(amount),
        description,
        date,
        category: (mode === "income" ? "Income" : category) as import("@/types/expense.types").ExpenseCategory,
        ...(mode === "income" ? { subCategory: incomeSource } : {}),
        currency,
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
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, v) => { if (v) setMode(v as "expense" | "income"); }}
        fullWidth
        size="small"
      >
        <ToggleButton value="expense" sx={{ gap: 0.75 }}>
          <TrendingDownIcon fontSize="small" />
          Expense
        </ToggleButton>
        <ToggleButton value="income" sx={{ gap: 0.75 }}>
          <TrendingUpIcon fontSize="small" />
          Income
        </ToggleButton>
      </ToggleButtonGroup>

      <TextField
        label="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        autoFocus
        slotProps={{
          htmlInput: { inputMode: "decimal" },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <AttachMoneyIcon />
              </InputAdornment>
            ),
          },
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
      {mode === "expense" ? (
        <FormControl fullWidth>
          <InputLabel>Category</InputLabel>
          <CategorySelect
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as string)}
          />
        </FormControl>
      ) : (
        <FormControl fullWidth>
          <InputLabel>Income Source</InputLabel>
          <Select
            label="Income Source"
            value={incomeSource}
            onChange={(e) => setIncomeSource(e.target.value)}
          >
            {INCOME_SOURCES.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      <TextField
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        fullWidth
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: tokens.radii.xl,
              borderTopRightRadius: tokens.radii.xl,
              p: 3,
              pb: 4,
            },
          },
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Add Transaction</Typography>
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
