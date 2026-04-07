import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Button,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { QueryResult } from "@/api/query.api";
import { expensesApi } from "@/api/expenses.api";

interface QueryResultCardProps {
  result: QueryResult;
  mode: "ask" | "add";
  onDismiss: () => void;
}

export function QueryResultCard({ result, mode, onDismiss }: QueryResultCardProps) {
  const handleConfirmAdd = async () => {
    if (!result.parsedTransaction) return;
    const t = result.parsedTransaction;
    await expensesApi.create({
      amount: t.amount,
      description: t.description,
      date: t.date,
      category: t.category as import("@/types/expense.types").ExpenseCategory,
      currency: "USD",
      source: "manual",
      isRecurring: false,
      tags: [],
      merchantName: t.merchantName,
    });
    onDismiss();
  };

  return (
    <Card sx={{ mt: 1.5, animation: "fadeIn 0.2s ease-in-out" }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Typography variant="h6" fontWeight={600}>{result.answer}</Typography>
          <IconButton size="small" onClick={onDismiss}><CloseIcon fontSize="small" /></IconButton>
        </Box>

        {mode === "add" && result.parsedTransaction && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 2 }}>
              {[
                ["Amount", `$${result.parsedTransaction.amount.toFixed(2)}`],
                ["Category", result.parsedTransaction.category],
                ["Date", new Date(result.parsedTransaction.date).toLocaleDateString()],
                ["Merchant", result.parsedTransaction.merchantName ?? "-"],
              ].map(([label, value]) => (
                <Box key={label}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" fontWeight={500}>{value}</Typography>
                </Box>
              ))}
            </Box>
            <Button variant="contained" fullWidth onClick={() => void handleConfirmAdd()}>
              Confirm & Save
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
