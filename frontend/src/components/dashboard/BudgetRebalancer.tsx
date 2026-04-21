import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Chip,
  Divider,
  Slider,
  Button,
  LinearProgress,
  Tooltip,
  IconButton,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { BudgetComparison } from "@/types/analytics.types";

interface Props {
  comparison: BudgetComparison;
  isCurrentMonth: boolean;
}

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function proportionalAllocations(
  withSlack: BudgetComparison["rows"],
  excluded: Set<string>,
  totalOverspend: number,
): Record<string, number> {
  const active = withSlack.filter((r) => !excluded.has(r.category));
  const activeSlack = active.reduce((sum, r) => sum + r.diff, 0);
  const dist = Math.min(totalOverspend, activeSlack);
  const result: Record<string, number> = {};
  for (const r of withSlack) {
    result[r.category] =
      excluded.has(r.category) || activeSlack === 0
        ? 0
        : Math.round(dist * (r.diff / activeSlack));
  }
  return result;
}

function equalAllocations(
  withSlack: BudgetComparison["rows"],
  excluded: Set<string>,
  totalOverspend: number,
): Record<string, number> {
  const active = withSlack.filter((r) => !excluded.has(r.category));
  const result: Record<string, number> = {};
  for (const r of withSlack) result[r.category] = 0;

  let remaining = Math.min(
    totalOverspend,
    active.reduce((s, r) => s + r.diff, 0),
  );
  let uncapped = [...active];

  while (remaining > 0.5 && uncapped.length > 0) {
    const share = remaining / uncapped.length;
    let overflow = 0;
    const nextUncapped: typeof uncapped = [];
    for (const r of uncapped) {
      const give = Math.min(share, r.diff - (result[r.category] ?? 0));
      result[r.category] = (result[r.category] ?? 0) + give;
      overflow += share - give;
      if (give >= share - 0.01) nextUncapped.push(r);
    }
    remaining = overflow;
    uncapped = nextUncapped;
  }

  for (const k of Object.keys(result)) result[k] = Math.round(result[k]);
  return result;
}

export function BudgetRebalancer({ comparison, isCurrentMonth }: Props) {
  const { rows } = comparison;

  const overspent = rows.filter((r) => r.planned > 0 && r.diff < 0);
  const withSlack = rows.filter((r) => r.planned > 0 && r.diff > 0);
  const totalOverspend = overspent.reduce((sum, r) => sum + Math.abs(r.diff), 0);

  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [allocations, setAllocations] = useState<Record<string, number>>(() =>
    proportionalAllocations(withSlack, new Set(), totalOverspend),
  );

  const totalCovered = useMemo(
    () =>
      withSlack
        .filter((r) => !excluded.has(r.category))
        .reduce((sum, r) => sum + (allocations[r.category] ?? 0), 0),
    [allocations, excluded, withSlack],
  );

  if (overspent.length === 0 || !isCurrentMonth) return null;

  const coveragePct = Math.min(100, (totalCovered / totalOverspend) * 100);
  const gap = totalOverspend - totalCovered;
  const fullyCovered = gap < 0.5 && totalCovered > 0;

  function toggleExclude(category: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
        setAllocations((a) => ({ ...a, [category]: 0 }));
      }
      return next;
    });
  }

  return (
    <>
        {/* Presets + over-budget chips */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Over budget in {overspent.length}{" "}
            {overspent.length === 1 ? "category" : "categories"}:
          </Typography>
          {withSlack.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Button size="small" variant="text" color="inherit"
                sx={{ fontSize: "0.75rem", color: "text.secondary" }}
                onClick={() => setAllocations(equalAllocations(withSlack, excluded, totalOverspend))}
              >Equal</Button>
              <Button size="small" variant="text" color="inherit"
                sx={{ fontSize: "0.75rem", color: "text.secondary" }}
                onClick={() => setAllocations(proportionalAllocations(withSlack, excluded, totalOverspend))}
              >Proportional</Button>
            </Box>
          )}
        </Box>

        {/* Over-budget chips */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Over budget in {overspent.length}{" "}
          {overspent.length === 1 ? "category" : "categories"}:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {overspent.map((r) => (
            <Chip
              key={r.category}
              label={`${r.category}  ${fmt(Math.abs(r.diff))} over`}
              color="error"
              size="small"
              variant="outlined"
            />
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Allocation rows */}
        {withSlack.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {withSlack.map((r) => {
              const isExcluded = excluded.has(r.category);
              const value = allocations[r.category] ?? 0;

              return (
                <Box
                  key={r.category}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1,
                    py: 0.75,
                    borderRadius: 1.5,
                    bgcolor: isExcluded ? "transparent" : "action.hover",
                    opacity: isExcluded ? 0.4 : 1,
                    transition: "opacity 0.15s, background-color 0.15s",
                  }}
                >
                  <Tooltip title={isExcluded ? "Include in rebalance" : "Exclude (fixed cost)"}>
                    <IconButton
                      size="small"
                      onClick={() => toggleExclude(r.category)}
                      sx={{ p: 0.25, color: isExcluded ? "text.disabled" : "text.secondary" }}
                    >
                      {isExcluded
                        ? <LockIcon sx={{ fontSize: 14 }} />
                        : <LockOpenIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>

                  <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, minWidth: 0 }} noWrap>
                    {r.category}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                    {fmt(r.diff)} left
                  </Typography>

                  <Slider
                    value={value}
                    min={0}
                    max={Math.round(r.diff)}
                    step={1}
                    disabled={isExcluded}
                    onChange={(_, v) =>
                      setAllocations((prev) => ({ ...prev, [r.category]: v as number }))
                    }
                    size="small"
                    color="warning"
                    sx={{ width: 110, flexShrink: 0, py: 0 }}
                  />

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: value > 0 ? "error.main" : "text.disabled",
                      minWidth: 86,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {value > 0 ? `−${fmt(value)}` : "no cut"}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No other budgeted categories have remaining room. You're{" "}
            {fmt(totalOverspend)} over your total budget this month.
          </Typography>
        )}

        {/* Coverage bar */}
        {withSlack.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
              <Typography variant="body2" color="text.secondary">Coverage</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {fmt(totalCovered)} of {fmt(totalOverspend)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={coveragePct}
              color={fullyCovered ? "success" : "warning"}
              sx={{ borderRadius: 1, height: 6 }}
            />
            {!fullyCovered && gap > 0.5 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                {fmt(gap)} still uncovered.
              </Typography>
            )}
            {fullyCovered && (
              <Typography variant="caption" color="success.main" sx={{ display: "block", mt: 0.75, fontWeight: 600 }}>
                Fully covered — follow these cuts to stay within budget.
              </Typography>
            )}
          </>
        )}
    </>
  );
}
