import { useState, useEffect } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableRow,
  IconButton, TextField, Tooltip, CircularProgress, Divider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { CollapsibleCard } from "@/components/shared/CollapsibleCard";
import { balanceApi, MonthlyBalanceSummary } from "@/api/balance.api";

interface Props {
  monthYear: string;
}

function fmt(n: number | null, currency: string): string {
  if (n === null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

function SavingsChip({ value, label }: { value: number | null; label: string }) {
  if (value === null) return null;
  const positive = value >= 0;
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 700, color: positive ? "success.main" : "error.main" }}
      >
        {positive ? "+" : ""}{fmt(value, "CAD")}
      </Typography>
    </Box>
  );
}

export function MonthlyBalanceCard({ monthYear }: Props) {
  const [data, setData] = useState<MonthlyBalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");

  useEffect(() => {
    setLoading(true);
    balanceApi
      .get(monthYear)
      .then((d) => {
        setData(d);
        setStartInput(d.startingBalance !== 0 ? String(d.startingBalance) : "");
        setEndInput(d.endingBalance !== null ? String(d.endingBalance) : "");
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [monthYear]);

  const hasBalance = data && (data.startingBalance !== 0 || data.endingBalance !== null);

  function openEdit() {
    if (data) {
      setStartInput(data.startingBalance !== 0 ? String(data.startingBalance) : "");
      setEndInput(data.endingBalance !== null ? String(data.endingBalance) : "");
    }
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function saveEdit() {
    const startVal = parseFloat(startInput);
    if (isNaN(startVal)) return;
    const endVal = endInput.trim() !== "" ? parseFloat(endInput) : null;
    if (endInput.trim() !== "" && isNaN(endVal as number)) return;

    setSaving(true);
    try {
      const result = await balanceApi.upsert({
        monthYear,
        startingBalance: startVal,
        endingBalance: endVal,
        currency: data?.currency ?? "CAD",
      });
      setData(result);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const currency = data?.currency ?? "CAD";

  return (
    <CollapsibleCard
      storageKey="analytics-balance"
      title={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AccountBalanceIcon fontSize="small" color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Monthly Balance</Typography>
        </Box>
      }
      action={
        !editing ? (
          <Tooltip title="Edit balances">
            <IconButton size="small" onClick={openEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null
      }
    >
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : editing ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, py: 1 }}>
          <TextField
            label="Starting Balance"
            type="number"
            value={startInput}
            onChange={(e) => setStartInput(e.target.value)}
            size="small"
            helperText="Bank balance at start of month"
            autoFocus
          />
          <TextField
            label="Ending Balance (optional)"
            type="number"
            value={endInput}
            onChange={(e) => setEndInput(e.target.value)}
            size="small"
            helperText="Actual bank balance at end of month — used to verify numbers add up"
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => void saveEdit()}
              disabled={saving || startInput.trim() === ""}
            >
              {saving ? <CircularProgress size={16} /> : <CheckIcon />}
            </IconButton>
            <IconButton size="small" onClick={cancelEdit} disabled={saving}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      ) : !hasBalance ? (
        <Box sx={{ py: 2, textAlign: "center" }}>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 1 }}>
            No starting balance set for this month.
          </Typography>
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={openEdit}
          >
            Add starting balance
          </Typography>
        </Box>
      ) : (
        <Box>
          <Table size="small" sx={{ mb: 2 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ color: "text.secondary", border: 0, pl: 0 }}>Starting Balance</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, border: 0, pr: 0 }}>
                  {fmt(data.startingBalance, currency)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ color: "text.secondary", border: 0, pl: 0 }}>Income</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, border: 0, pr: 0, color: "success.main" }}>
                  {fmt(data.income, currency)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ color: "text.secondary", border: 0, pl: 0 }}>Total Spent</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, border: 0, pr: 0, color: "error.main" }}>
                  {fmt(data.totalSpent, currency)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ color: "text.secondary", border: 0, pl: 0 }}>
                  Ending Balance
                  <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
                    (computed)
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, border: 0, pr: 0 }}>
                  {fmt(data.computedEndingBalance, currency)}
                </TableCell>
              </TableRow>
              {data.endingBalance !== null && (
                <TableRow>
                  <TableCell sx={{ color: "text.secondary", border: 0, pl: 0 }}>
                    Ending Balance
                    <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
                      (actual)
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, border: 0, pr: 0 }}>
                    {fmt(data.endingBalance, currency)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Divider sx={{ mb: 1.5 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <SavingsChip value={data.savingsIncomeBased} label="Savings (income vs expenses)" />
            {data.savingsBalanceBased !== null && (
              <>
                <SavingsChip value={data.savingsBalanceBased} label="Savings (actual bank change)" />
                {Math.abs(data.savingsIncomeBased - data.savingsBalanceBased) > 1 && (
                  <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                    {fmt(Math.abs(data.savingsIncomeBased - data.savingsBalanceBased), currency)} discrepancy — some transactions may be untracked
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Box>
      )}
    </CollapsibleCard>
  );
}
