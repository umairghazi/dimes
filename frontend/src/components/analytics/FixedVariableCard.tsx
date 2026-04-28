import { useMemo } from "react";
import { Box, Card, CardContent, Typography, Chip } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import TuneIcon from "@mui/icons-material/Tune";
import { MonthlySummary, CategorySummary } from "@/types/analytics.types";
import { UserCategory } from "@/types/category.types";

interface Props {
  summary: MonthlySummary;
  categories: UserCategory[];
  onCategoryClick: (category: string) => void;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtDecimal(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

export function FixedVariableCard({ summary, categories, onCategoryClick }: Props) {
  const fixedSet = useMemo(
    () => new Set(categories.filter((c) => c.isFixed).map((c) => c.name)),
    [categories],
  );

  const { fixed, variable } = useMemo(() => {
    const fixed: CategorySummary[] = [];
    const variable: CategorySummary[] = [];
    for (const c of summary.byCategory) {
      (fixedSet.has(c.category) ? fixed : variable).push(c);
    }
    return { fixed, variable };
  }, [summary.byCategory, fixedSet]);

  const fixedTotal = fixed.reduce((s, c) => s + c.amount, 0);
  const variableTotal = variable.reduce((s, c) => s + c.amount, 0);
  const total = fixedTotal + variableTotal;

  if (total === 0) return null;

  const fixedPct = total > 0 ? (fixedTotal / total) * 100 : 0;
  const variablePct = 100 - fixedPct;

  const variableSorted = [...variable].sort((a, b) => b.amount - a.amount);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Fixed vs Variable</Typography>

        {/* Split bar */}
        <Box sx={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", mb: 1.5 }}>
          <Box sx={{ width: `${fixedPct}%`, bgcolor: "text.disabled", transition: "width 0.3s" }} />
          <Box sx={{ width: `${variablePct}%`, bgcolor: "primary.main", transition: "width 0.3s" }} />
        </Box>

        {/* Totals row */}
        <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}>
              <LockOutlinedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>
                Fixed
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "text.secondary" }}>
              {fmt(fixedTotal)}
            </Typography>
            <Typography variant="caption" color="text.secondary">{fixedPct.toFixed(0)}% of spend</Typography>
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}>
              <TuneIcon sx={{ fontSize: 14, color: "primary.main" }} />
              <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, color: "primary.main" }}>
                Variable
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
              {fmt(variableTotal)}
            </Typography>
            <Typography variant="caption" color="text.secondary">{variablePct.toFixed(0)}% of spend — your levers</Typography>
          </Box>
        </Box>

        {/* Fixed categories */}
        {fixed.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
              <LockOutlinedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Fixed costs
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {[...fixed].sort((a, b) => b.amount - a.amount).map((c) => (
                <Box
                  key={c.category}
                  sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", "&:hover .cat-name": { color: "primary.main" } }}
                  onClick={() => onCategoryClick(c.category)}
                >
                  <Typography className="cat-name" variant="body2" sx={{ flex: 1, color: "text.secondary", transition: "color 0.15s" }}>
                    {c.category}
                  </Typography>
                  <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums", color: "text.secondary" }}>
                    {fmtDecimal(c.amount)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Variable categories — ranked as levers */}
        {variableSorted.length > 0 && (
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
              <TuneIcon sx={{ fontSize: 13, color: "primary.main" }} />
              <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "primary.main" }}>
                Variable — controllable
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {variableSorted.map((c) => {
                const cutTen = c.amount * 0.1;
                return (
                  <Box
                    key={c.category}
                    sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", "&:hover .cat-name": { color: "primary.main" } }}
                    onClick={() => onCategoryClick(c.category)}
                  >
                    <Typography className="cat-name" variant="body2" sx={{ flex: 1, transition: "color 0.15s" }}>
                      {c.category}
                    </Typography>
                    <Chip
                      label={`−10% = ${fmt(cutTen)}`}
                      size="small"
                      variant="outlined"
                      color="success"
                      sx={{ height: 18, fontSize: "0.6rem", "& .MuiChip-label": { px: 0.75 } }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", minWidth: 64, textAlign: "right" }}>
                      {fmtDecimal(c.amount)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
            {variableSorted.length >= 3 && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Trim top 3 variable categories by 10% →{" "}
                  <Box component="span" sx={{ fontWeight: 700, color: "success.main" }}>
                    save {fmt(variableSorted.slice(0, 3).reduce((s, c) => s + c.amount * 0.1, 0))} next month
                  </Box>
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {fixed.length === 0 && (
          <Typography variant="caption" color="text.disabled">
            Pin categories as fixed in the Categories page to see the split.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
