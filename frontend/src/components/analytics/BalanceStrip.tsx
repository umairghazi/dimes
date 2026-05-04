import { useState, useEffect } from "react";
import {
  Box, Card, CardContent, Typography, IconButton,
  TextField, Tooltip, CircularProgress, Skeleton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { balanceApi } from "@/api/balance.api";
import { MonthlySummary } from "@/types/analytics.types";

interface Props {
  monthYear: string;
  summary: MonthlySummary | null;
  loading?: boolean;
}

function fmt(n: number, currency = "CAD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          fontWeight: 600,
          color: "text.secondary",
          mb: 0.25,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          color: color ?? "text.primary",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export function BalanceStrip({ monthYear, summary, loading: summaryLoading }: Props) {
  const [startingBalance, setStartingBalance] = useState<number | null>(null);
  const [endingBalance, setEndingBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState("CAD");
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");

  useEffect(() => {
    setBalanceLoading(true);
    balanceApi
      .get(monthYear)
      .then((d) => {
        const start = d.startingBalance !== 0 ? d.startingBalance : null;
        setStartingBalance(start);
        setEndingBalance(d.endingBalance);
        setCurrency(d.currency);
        setStartInput(start !== null ? String(start) : "");
        setEndInput(d.endingBalance !== null ? String(d.endingBalance) : "");
      })
      .catch(() => {})
      .finally(() => setBalanceLoading(false));
  }, [monthYear]);

  function openEdit() {
    setStartInput(startingBalance !== null ? String(startingBalance) : "");
    setEndInput(endingBalance !== null ? String(endingBalance) : "");
    setEditing(true);
  }

  async function saveEdit() {
    const startVal = parseFloat(startInput);
    if (isNaN(startVal)) return;
    const endVal = endInput.trim() !== "" ? parseFloat(endInput) : null;
    if (endInput.trim() !== "" && isNaN(endVal as number)) return;
    setSaving(true);
    try {
      const result = await balanceApi.upsert({ monthYear, startingBalance: startVal, endingBalance: endVal, currency });
      setStartingBalance(result.startingBalance !== 0 ? result.startingBalance : null);
      setEndingBalance(result.endingBalance);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const income = summary?.totalIncome ?? 0;
  const spent = summary?.totalSpend ?? 0;
  const netSavings = summary?.netSavings ?? 0;
  const savingsRate = income > 0 ? (netSavings / income) * 100 : null;
  const computedEnding = startingBalance !== null ? startingBalance + income - spent : null;
  const savingsColor =
    savingsRate === null ? "text.secondary"
    : savingsRate >= 20 ? "success.main"
    : savingsRate >= 0 ? "warning.main"
    : "error.main";

  if (summaryLoading || balanceLoading) {
    return <Skeleton variant="rectangular" height={96} sx={{ borderRadius: 2 }} />;
  }

  if (editing) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ p: "20px !important" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Set monthly balance</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-start" }}>
            <TextField
              label="Starting Balance"
              type="number"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              size="small"
              helperText="Bank balance at start of month"
              autoFocus
              sx={{ width: 180 }}
            />
            <TextField
              label="Ending Balance (optional)"
              type="number"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              size="small"
              helperText="Actual bank balance at month end"
              sx={{ width: 200 }}
            />
            <Box sx={{ display: "flex", gap: 0.5, pt: 0.5 }}>
              <IconButton
                size="small"
                color="primary"
                onClick={() => void saveEdit()}
                disabled={saving || startInput.trim() === ""}
              >
                {saving ? <CircularProgress size={16} /> : <CheckIcon />}
              </IconButton>
              <IconButton size="small" onClick={() => setEditing(false)} disabled={saving}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const cols = startingBalance !== null ? 5 : 3;

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: "20px !important" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Box
            sx={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: `repeat(${cols}, 1fr)` },
              gap: { xs: 2, sm: 3 },
            }}
          >
            {startingBalance !== null && (
              <Metric label="Starting" value={fmt(startingBalance, currency)} />
            )}
            <Metric label="Income" value={`+${fmt(income, currency)}`} color="success.main" />
            <Metric label="Spent" value={`−${fmt(spent, currency)}`} color="error.main" />
            {computedEnding !== null && (
              <Metric label="Ending" value={fmt(computedEnding, currency)} />
            )}
            <Metric
              label={savingsRate !== null ? `Saved · ${savingsRate.toFixed(0)}%` : "Saved"}
              value={savingsRate !== null ? fmt(netSavings, currency) : "—"}
              color={savingsColor}
            />
          </Box>

          <Box sx={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
            <Tooltip title={startingBalance !== null ? "Edit balances" : "Set starting balance"}>
              <IconButton size="small" onClick={openEdit} sx={{ color: "text.secondary" }}>
                {startingBalance !== null ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            {startingBalance === null && (
              <Typography variant="caption" color="text.disabled" sx={{ maxWidth: 90, textAlign: "right", lineHeight: 1.3 }}>
                Add start balance
              </Typography>
            )}
          </Box>
        </Box>

        {endingBalance !== null && computedEnding !== null && Math.abs(computedEnding - endingBalance) > 1 && (
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: "divider" }}>
            <Typography variant="caption" color="warning.main">
              Actual ending: {fmt(endingBalance, currency)} · {fmt(Math.abs(computedEnding - endingBalance), currency)} discrepancy — some transactions may be untracked
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
