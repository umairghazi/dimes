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
import { useTheme } from "@/theme/useTheme";
import { tokens } from "@/theme/tokens";
import { CategorySummary } from "@/types/analytics.types";

function formatCurrency(amount: number) {
  return "$" + Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMonth(monthYear: string) {
  const [y, m] = monthYear.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

type ThemeColors = ReturnType<typeof useTheme>["colors"];

function StatCard({
  label,
  value,
  iconName,
  iconBg,
  iconColor,
  valueColor,
  colors,
  shadow,
}: {
  label: string;
  value: string;
  iconName: any;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  colors: ThemeColors;
  shadow: object;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}>
      <View style={styles.statCardHeader}>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
        <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={16} color={iconColor} />
        </View>
      </View>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function CategoryRow({ item, colors }: { item: CategorySummary; colors: ThemeColors }) {
  const percent = item.budgetPercent ?? 0;
  const hasbudget = item.budgetLimit != null;
  const barColor =
    percent >= 100 ? tokens.colors.budgetRed
    : percent >= 80 ? tokens.colors.budgetAmber
    : tokens.colors.budgetGreen;

  return (
    <View style={styles.catRow}>
      <View style={styles.catRowHeader}>
        <Text style={[styles.catName, { color: colors.textPrimary }]}>{item.category}</Text>
        <View style={styles.catRowRight}>
          {hasbudget && (
            <Text style={[styles.catPercent, {
              color: percent >= 100 ? tokens.colors.budgetRed
                : percent >= 80 ? tokens.colors.budgetAmber
                : tokens.colors.budgetGreen
            }]}>
              {Math.round(percent)}%
            </Text>
          )}
          <Text style={[styles.catAmount, { color: colors.textSecondary }]}>
            {formatCurrency(item.amount)}
            {hasbudget ? ` / ${formatCurrency(item.budgetLimit!)}` : ""}
          </Text>
        </View>
      </View>
      {hasbudget && (
        <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.barFill, { width: `${Math.min(percent, 100)}%` as any, backgroundColor: barColor }]} />
        </View>
      )}
    </View>
  );
}

export default function DashboardScreen() {
  const { month, prevMonth, nextMonth, isCurrentMonth, summary, loading, error, refetch } = useAnalytics();
  const { colors, shadow, dark } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
    >
      {/* Month navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>{formatMonth(month)}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn} disabled={isCurrentMonth} hitSlop={8}>
          <Ionicons name="chevron-forward" size={22} color={isCurrentMonth ? colors.textSecondary : colors.accent} />
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {loading && !summary ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} />
      ) : summary ? (
        <>
          {/* Stat cards */}
          <View style={styles.statGrid}>
            <StatCard
              label="TOTAL SPEND"
              value={formatCurrency(summary.totalSpend)}
              iconName="trending-down"
              iconBg={tokens.colors.errorBg}
              iconColor={tokens.colors.error}
              valueColor={colors.textPrimary}
              colors={colors}
              shadow={shadow}
            />
            <StatCard
              label="INCOME"
              value={formatCurrency(summary.totalIncome)}
              iconName="trending-up"
              iconBg={tokens.colors.successBg}
              iconColor={tokens.colors.success}
              valueColor={tokens.colors.success}
              colors={colors}
              shadow={shadow}
            />
            <StatCard
              label="NET SAVINGS"
              value={(summary.netSavings < 0 ? "-" : "") + formatCurrency(summary.netSavings)}
              iconName="wallet-outline"
              iconBg={tokens.colors.accentBg}
              iconColor={tokens.colors.accent}
              valueColor={summary.netSavings >= 0 ? tokens.colors.success : tokens.colors.error}
              colors={colors}
              shadow={shadow}
            />
          </View>

          {/* Spending by category */}
          {summary.byCategory.length > 0 ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Spending by Category</Text>
              <View style={styles.catList}>
                {summary.byCategory.map((item, i) => (
                  <View key={item.category}>
                    {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                    <CategoryRow item={item} colors={colors} />
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No expenses this month</Text>
            </View>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: tokens.spacing.md, paddingBottom: tokens.spacing.xl },

  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.spacing.lg,
  },
  navBtn: { padding: tokens.spacing.xs },
  monthLabel: { fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },

  errorText: { color: tokens.colors.error, textAlign: "center", marginBottom: tokens.spacing.md },

  statGrid: { gap: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  statCard: {
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    padding: tokens.spacing.md,
  },
  statCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacing.sm,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 34,
  },

  card: {
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: tokens.spacing.md,
    letterSpacing: -0.2,
  },
  catList: { gap: 0 },
  divider: { height: 1, marginVertical: tokens.spacing.sm },

  catRow: { gap: 6 },
  catRowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  catName: { fontSize: 14, fontWeight: "500", flex: 1 },
  catRowRight: { flexDirection: "row", alignItems: "center", gap: tokens.spacing.sm },
  catPercent: { fontSize: 12, fontWeight: "700" },
  catAmount: { fontSize: 13 },
  barTrack: { height: 8, borderRadius: tokens.radii.pill, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: tokens.radii.pill },

  empty: { alignItems: "center", paddingTop: 60, gap: tokens.spacing.md },
  emptyText: { fontSize: 15 },
});
