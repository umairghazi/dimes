import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useCategories } from "@/hooks/useCategories";
import { useTheme } from "@/theme/useTheme";
import { tokens } from "@/theme/tokens";
import type { MonthlySummary, MerchantTotal } from "@/types/analytics.types";
import type { UserCategory } from "@/types/category.types";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function fmtMonth(monthYear: string) {
  const [y, m] = monthYear.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// ── tiny primitives ───────────────────────────────────────────────────────────

function BarGauge({ pct, color, bg }: { pct: number; color: string; bg: string }) {
  return (
    <View style={[styles.barTrack, { backgroundColor: bg }]}>
      <View style={[styles.barFill, { width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }]} />
    </View>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors, shadow } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}>
      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
      {children}
    </View>
  );
}

// ── Stat cards row ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const { colors, shadow } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor ?? colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

// ── Spending Pace ─────────────────────────────────────────────────────────────

function SpendingPaceCard({ summary, monthYear }: { summary: MonthlySummary; monthYear: string }) {
  const { colors } = useTheme();
  const now = new Date();
  const [y, m] = monthYear.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const daysElapsed = Math.max(1, now.getDate());
  const daysRemaining = daysInMonth - daysElapsed;
  const dailyRate = summary.totalSpend / daysElapsed;
  const projected = dailyRate * daysInMonth;
  const projectedSavings = summary.totalIncome > 0 ? summary.totalIncome - projected : null;
  const pacePercent = summary.totalIncome > 0 ? (projected / summary.totalIncome) * 100 : 0;
  const isShortfall = projectedSavings !== null && projectedSavings < 0;
  const barColor =
    pacePercent > 100
      ? tokens.colors.error
      : pacePercent > 80
        ? tokens.colors.warning
        : tokens.colors.success;

  return (
    <Card title="Spending Pace">
      <View style={styles.paceRow}>
        <View style={styles.paceStat}>
          <Text style={[styles.paceValue, { color: colors.textPrimary }]}>{fmt(dailyRate)}<Text style={[styles.paceUnit, { color: colors.textSecondary }]}>/day</Text></Text>
          <Text style={[styles.paceLabel, { color: colors.textSecondary }]}>Daily rate</Text>
        </View>
        <View style={[styles.paceDivider, { backgroundColor: colors.border }]} />
        <View style={styles.paceStat}>
          <Text style={[styles.paceValue, { color: colors.textPrimary }]}>{fmt(projected)}</Text>
          <Text style={[styles.paceLabel, { color: colors.textSecondary }]}>Projected</Text>
        </View>
        {projectedSavings !== null && (
          <>
            <View style={[styles.paceDivider, { backgroundColor: colors.border }]} />
            <View style={styles.paceStat}>
              <Text style={[styles.paceValue, { color: isShortfall ? tokens.colors.error : tokens.colors.success }]}>
                {isShortfall ? "-" : "+"}{fmt(Math.abs(projectedSavings))}
              </Text>
              <Text style={[styles.paceLabel, { color: colors.textSecondary }]}>{isShortfall ? "Shortfall" : "Savings"}</Text>
            </View>
          </>
        )}
      </View>
      <BarGauge pct={pacePercent} color={barColor} bg={colors.border} />
      <Text style={[styles.paceDays, { color: colors.textSecondary }]}>
        {daysElapsed} of {daysInMonth} days elapsed · {daysRemaining} remaining
      </Text>
    </Card>
  );
}

// ── Pareto 80/20 ──────────────────────────────────────────────────────────────

function ParetoCard({ summary }: { summary: MonthlySummary }) {
  const { colors } = useTheme();
  const sorted = [...summary.byCategory]
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const totalSpend = sorted.reduce((s, c) => s + c.amount, 0);

  let cumulative = 0;
  let paretoCount = 0;
  const items = sorted.slice(0, 8).map((c) => {
    cumulative += c.amount;
    const cumPct = totalSpend > 0 ? cumulative / totalSpend : 0;
    const pct = totalSpend > 0 ? (c.amount / totalSpend) * 100 : 0;
    if (cumulative - c.amount < totalSpend * 0.8) paretoCount++;
    return { ...c, pct, isPareto: cumulative <= totalSpend * 0.8 || paretoCount >= sorted.length };
  });

  const paretoSet = items.filter((c) => c.isPareto);

  return (
    <Card title="80/20 Breakdown">
      <Text style={[styles.paretoHeadline, { color: colors.textSecondary }]}>
        {paretoSet.length} {paretoSet.length === 1 ? "category" : "categories"} account for 80% of spending
      </Text>
      {items.map((c, i) => (
        <View key={c.category} style={styles.paretoRow}>
          <View style={styles.paretoLabelRow}>
            <Text style={[styles.paretoRank, { color: colors.textSecondary }]}>{i + 1}</Text>
            <Text
              style={[styles.paretoCat, { color: c.isPareto ? colors.textPrimary : colors.textSecondary }]}
              numberOfLines={1}
            >
              {c.category}
            </Text>
            <Text style={[styles.paretoAmt, { color: colors.textPrimary }]}>{fmt(c.amount)}</Text>
            <Text style={[styles.paretoPct, { color: colors.textSecondary }]}>{c.pct.toFixed(0)}%</Text>
          </View>
          <BarGauge
            pct={c.pct}
            color={c.isPareto ? tokens.colors.accent : colors.border}
            bg={colors.border}
          />
        </View>
      ))}
    </Card>
  );
}

// ── Month-over-Month ──────────────────────────────────────────────────────────

function MoMCard({
  summary,
  prevSummary,
}: {
  summary: MonthlySummary;
  prevSummary: MonthlySummary | null;
}) {
  const { colors } = useTheme();

  if (!prevSummary) {
    return (
      <Card title="Month-over-Month">
        <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No prior month data available</Text>
      </Card>
    );
  }

  const prevMap = new Map(prevSummary.byCategory.map((c) => [c.category, c.amount]));
  const changes = summary.byCategory
    .filter((c) => c.amount > 0)
    .map((c) => {
      const prev = prevMap.get(c.category) ?? 0;
      return { category: c.category, current: c.amount, prev, delta: c.amount - prev };
    })
    .filter((c) => c.prev > 0 || c.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 6);

  return (
    <Card title="Month-over-Month">
      {changes.length === 0 ? (
        <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No comparable changes</Text>
      ) : (
        changes.map((c) => {
          const isUp = c.delta > 0;
          const deltaColor = isUp ? tokens.colors.error : tokens.colors.success;
          return (
            <View key={c.category} style={[styles.momRow, { borderBottomColor: colors.border }]}>
              <Ionicons
                name={isUp ? "trending-up" : "trending-down"}
                size={15}
                color={deltaColor}
                style={{ marginRight: 6, flexShrink: 0 }}
              />
              <Text style={[styles.momCat, { color: colors.textPrimary }]} numberOfLines={1}>
                {c.category}
              </Text>
              <View style={styles.momRight}>
                <Text style={[styles.momDelta, { color: deltaColor }]}>
                  {isUp ? "+" : ""}{fmt(c.delta)}
                </Text>
                <Text style={[styles.momPrev, { color: colors.textSecondary }]}>
                  {fmt(c.prev)} → {fmt(c.current)}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </Card>
  );
}

// ── Top Merchants ─────────────────────────────────────────────────────────────

function TopMerchantsCard({ merchants }: { merchants: MerchantTotal[] }) {
  const { colors } = useTheme();
  const top = merchants.slice(0, 8);
  const maxTotal = top[0]?.total ?? 1;

  return (
    <Card title="Top Merchants">
      {top.length === 0 ? (
        <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No merchant data this month</Text>
      ) : (
        top.map((m, i) => (
          <View key={m.merchant} style={styles.merchantRow}>
            <View style={styles.merchantLabelRow}>
              <Text style={[styles.merchantRank, { color: colors.textSecondary }]}>{i + 1}</Text>
              <Text style={[styles.merchantName, { color: colors.textPrimary }]} numberOfLines={1}>
                {m.merchant}
              </Text>
              <Text style={[styles.merchantCount, { color: colors.textSecondary }]}>{m.count}x</Text>
              <Text style={[styles.merchantTotal, { color: colors.textPrimary }]}>{fmt(m.total)}</Text>
            </View>
            <BarGauge pct={(m.total / maxTotal) * 100} color={tokens.colors.accent} bg={colors.border} />
          </View>
        ))
      )}
    </Card>
  );
}

// ── Fixed vs Variable ─────────────────────────────────────────────────────────

function FixedVariableCard({
  summary,
  categories,
}: {
  summary: MonthlySummary;
  categories: UserCategory[];
}) {
  const { colors } = useTheme();
  const fixedNames = new Set(categories.filter((c) => c.isFixed).map((c) => c.name));

  const fixed = summary.byCategory.filter((c) => fixedNames.has(c.category) && c.amount > 0);
  const variable = summary.byCategory
    .filter((c) => !fixedNames.has(c.category) && c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const fixedTotal = fixed.reduce((s, c) => s + c.amount, 0);
  const varTotal = variable.reduce((s, c) => s + c.amount, 0);
  const total = fixedTotal + varTotal || 1;
  const fixedPct = (fixedTotal / total) * 100;
  const varPct = (varTotal / total) * 100;

  const top3 = variable.slice(0, 3);
  const trimSavings = top3.reduce((s, c) => s + c.amount * 0.1, 0);

  return (
    <Card title="Fixed vs Variable">
      {/* Split bar */}
      <View style={styles.splitBarWrap}>
        <View style={[styles.splitSegment, { flex: fixedPct || 0.001, backgroundColor: colors.textSecondary, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]} />
        <View style={[styles.splitSegment, { flex: varPct || 0.001, backgroundColor: tokens.colors.accent, borderTopRightRadius: 4, borderBottomRightRadius: 4 }]} />
      </View>
      <View style={styles.splitLegend}>
        <View style={styles.splitLegendItem}>
          <View style={[styles.splitDot, { backgroundColor: colors.textSecondary }]} />
          <Text style={[styles.splitLegendText, { color: colors.textSecondary }]}>
            Fixed {fmt(fixedTotal)} ({fixedPct.toFixed(0)}%)
          </Text>
        </View>
        <View style={styles.splitLegendItem}>
          <View style={[styles.splitDot, { backgroundColor: tokens.colors.accent }]} />
          <Text style={[styles.splitLegendText, { color: colors.textSecondary }]}>
            Variable {fmt(varTotal)} ({varPct.toFixed(0)}%)
          </Text>
        </View>
      </View>

      {variable.length > 0 && (
        <>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Variable (in your control)</Text>
          {variable.slice(0, 5).map((c) => (
            <View key={c.category} style={[styles.varRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.varCat, { color: colors.textPrimary }]} numberOfLines={1}>
                {c.category}
              </Text>
              <View style={styles.varRight}>
                <View style={[styles.savingsChip, { backgroundColor: colors.successBg }]}>
                  <Text style={[styles.savingsChipText, { color: colors.success }]}>
                    −10% = {fmt(c.amount * 0.1)}
                  </Text>
                </View>
                <Text style={[styles.varAmt, { color: colors.textPrimary }]}>{fmt(c.amount)}</Text>
              </View>
            </View>
          ))}
          {top3.length > 0 && (
            <View style={[styles.trimSummary, { backgroundColor: colors.successBg }]}>
              <Text style={[styles.trimText, { color: colors.success }]}>
                Trim top {top3.length} variable by 10% → save {fmt(trimSavings)}/mo
              </Text>
            </View>
          )}
        </>
      )}
    </Card>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const {
    month,
    prevMonth,
    nextMonth,
    isCurrentMonth,
    summary,
    trends,
    merchants,
    loading,
    error,
    refetch,
  } = useAnalytics();
  const { categories } = useCategories();

  const [y, m] = month.split("-").map(Number);
  const prevD = new Date(y, m - 2, 1);
  const prevPeriod = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, "0")}`;
  const prevSummary = trends.find((t) => t.period === prevPeriod) ?? null;

  const savingsRate =
    summary && summary.totalIncome > 0
      ? Math.round((summary.netSavings / summary.totalIncome) * 100)
      : null;

  const hasFixed = categories.some((c) => c.isFixed);

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.error, marginBottom: 12 }}>{error}</Text>
        <TouchableOpacity onPress={refetch} style={[styles.retryBtn, { borderColor: colors.accent }]}>
          <Text style={{ color: colors.accent, fontWeight: "600" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Month nav */}
      <View style={[styles.monthNav, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>{fmtMonth(month)}</Text>
        <TouchableOpacity
          onPress={nextMonth}
          disabled={isCurrentMonth}
          style={styles.monthBtn}
          hitSlop={12}
        >
          <Ionicons name="chevron-forward" size={22} color={isCurrentMonth ? colors.textSecondary : colors.accent} />
        </TouchableOpacity>
      </View>

      {loading && !summary ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : !summary ? null : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
        >
          {/* Stat cards */}
          <View style={styles.statsRow}>
            <StatCard label="Spent" value={fmt(summary.totalSpend)} />
            <StatCard label="Income" value={fmt(summary.totalIncome)} valueColor={colors.success} />
            <StatCard
              label="Saved"
              value={savingsRate !== null ? `${savingsRate}%` : "—"}
              valueColor={
                savingsRate !== null
                  ? savingsRate >= 20
                    ? colors.success
                    : savingsRate >= 0
                      ? colors.warning
                      : colors.error
                  : undefined
              }
            />
          </View>

          {isCurrentMonth && <SpendingPaceCard summary={summary} monthYear={month} />}

          {summary.byCategory.length > 0 && <ParetoCard summary={summary} />}

          <MoMCard summary={summary} prevSummary={prevSummary} />

          {merchants.length > 0 && <TopMerchantsCard merchants={merchants} />}

          {hasFixed && <FixedVariableCard summary={summary} categories={categories} />}
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  retryBtn: { borderWidth: 1, borderRadius: tokens.radii.md, paddingHorizontal: 16, paddingVertical: 8 },

  // Month nav
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
  },
  monthBtn: { padding: 4 },
  monthLabel: { fontSize: 16, fontWeight: "700", letterSpacing: -0.3 },

  content: { padding: tokens.spacing.md, gap: tokens.spacing.md, paddingBottom: tokens.spacing.xl },

  // Stat cards
  statsRow: { flexDirection: "row", gap: tokens.spacing.sm },
  statCard: {
    flex: 1,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    padding: tokens.spacing.sm,
    alignItems: "center",
  },
  statLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },

  // Card
  card: {
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },

  // Bar gauge
  barTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },

  // Spending pace
  paceRow: { flexDirection: "row", alignItems: "center", gap: tokens.spacing.xs },
  paceStat: { flex: 1, alignItems: "center" },
  paceDivider: { width: 1, height: 32 },
  paceValue: { fontSize: 16, fontWeight: "700" },
  paceUnit: { fontSize: 12, fontWeight: "400" },
  paceLabel: { fontSize: 11, marginTop: 2 },
  paceDays: { fontSize: 11, textAlign: "center" },

  // Pareto
  paretoHeadline: { fontSize: 12, marginBottom: 4 },
  paretoRow: { gap: 4 },
  paretoLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  paretoRank: { fontSize: 12, width: 16, textAlign: "right", flexShrink: 0 },
  paretoCat: { flex: 1, fontSize: 13 },
  paretoAmt: { fontSize: 13, fontWeight: "600", flexShrink: 0 },
  paretoPct: { fontSize: 11, width: 30, textAlign: "right", flexShrink: 0 },

  // MoM
  emptyNote: { fontSize: 13, textAlign: "center", paddingVertical: tokens.spacing.sm },
  momRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
  },
  momCat: { flex: 1, fontSize: 13 },
  momRight: { alignItems: "flex-end" },
  momDelta: { fontSize: 13, fontWeight: "700" },
  momPrev: { fontSize: 11 },

  // Merchants
  merchantRow: { gap: 4 },
  merchantLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  merchantRank: { fontSize: 12, width: 16, textAlign: "right", flexShrink: 0 },
  merchantName: { flex: 1, fontSize: 13 },
  merchantCount: { fontSize: 11, flexShrink: 0 },
  merchantTotal: { fontSize: 13, fontWeight: "600", flexShrink: 0 },

  // Fixed vs variable
  splitBarWrap: { flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden" },
  splitSegment: { height: 10 },
  splitLegend: { flexDirection: "row", gap: tokens.spacing.md, marginTop: 4 },
  splitLegendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  splitDot: { width: 8, height: 8, borderRadius: 4 },
  splitLegendText: { fontSize: 12 },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginTop: tokens.spacing.xs,
  },
  varRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    gap: tokens.spacing.sm,
  },
  varCat: { flex: 1, fontSize: 13 },
  varRight: { flexDirection: "row", alignItems: "center", gap: tokens.spacing.sm, flexShrink: 0 },
  savingsChip: {
    borderRadius: tokens.radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  savingsChipText: { fontSize: 11, fontWeight: "600" },
  varAmt: { fontSize: 13, fontWeight: "600", minWidth: 52, textAlign: "right" },
  trimSummary: {
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.sm,
    marginTop: tokens.spacing.xs,
  },
  trimText: { fontSize: 12, fontWeight: "600", textAlign: "center" },
});
