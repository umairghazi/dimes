import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Skeleton,
  Box,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useState } from "react";
import { BudgetComparison } from "@/types/analytics.types";

interface Props {
  data: BudgetComparison | null;
  loading: boolean;
}

function fmt(n: number) {
  return `$${n.toFixed(2)}`;
}

function DiffCell({ value }: { value: number }) {
  const color = value > 0 ? "success.main" : value < 0 ? "error.main" : "text.secondary";
  const label = value > 0 ? `+${fmt(value)}` : fmt(value);
  return (
    <TableCell align="right" sx={{ color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
      {label}
    </TableCell>
  );
}

export function BudgetComparisonTable({ data, loading }: Props) {
  const [hideEmpty, setHideEmpty] = useState(false);

  if (loading) {
    return (
      <Box>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} height={40} sx={{ mb: 0.5 }} />
        ))}
      </Box>
    );
  }

  if (!data) return null;

  const rows = hideEmpty
    ? data.rows.filter((r) => r.planned > 0 || r.actual > 0)
    : data.rows;

  const { totals } = data;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={hideEmpty}
              onChange={(e) => setHideEmpty(e.target.checked)}
            />
          }
          label={<Typography variant="caption">Hide $0 rows</Typography>}
        />
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Planned</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Actual</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Diff</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Totals row */}
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 700 }}>Totals</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                {fmt(totals.planned)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                {fmt(totals.actual)}
              </TableCell>
              <DiffCell value={totals.diff} />
            </TableRow>

            {rows.map((row) => (
              <TableRow key={row.category} hover>
                <TableCell>{row.category}</TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", color: "text.secondary" }}>
                  {fmt(row.planned)}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {fmt(row.actual)}
                </TableCell>
                <DiffCell value={row.diff} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
