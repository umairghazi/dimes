import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useExpenses } from "@/hooks/useExpenses";
import { useTheme } from "@/theme/useTheme";
import { tokens } from "@/theme/tokens";
import { Expense, ExpenseFilters } from "@/types/expense.types";

function formatCurrency(amount: number) {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function categoryInitial(category: string) {
  return category.charAt(0).toUpperCase();
}

// Deterministic color from category name
const BADGE_COLORS = [
  { bg: "rgba(124,58,237,0.1)", text: "#7c3aed" },
  { bg: "rgba(22,163,74,0.1)", text: "#16a34a" },
  { bg: "rgba(217,119,6,0.1)", text: "#d97706" },
  { bg: "rgba(2,132,199,0.1)", text: "#0284c7" },
  { bg: "rgba(220,38,38,0.1)", text: "#dc2626" },
  { bg: "rgba(124,58,237,0.15)", text: "#6d28d9" },
];
function badgeColor(category: string) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
  return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length];
}

function ExpenseRow({
  item,
  onDelete,
  colors,
  shadow,
}: {
  item: Expense;
  onDelete: (id: string) => void;
  colors: ReturnType<typeof useTheme>["colors"];
  shadow: object;
}) {
  const badge = badgeColor(item.category);

  function confirmDelete() {
    Alert.alert("Delete Expense", `Delete "${item.description}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(item.id) },
    ]);
  }

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}
      onLongPress={confirmDelete}
      activeOpacity={0.7}
    >
      {/* Category badge */}
      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.badgeText, { color: badge.text }]}>{categoryInitial(item.category)}</Text>
      </View>

      <View style={styles.rowBody}>
        <Text style={[styles.rowDesc, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.description}
        </Text>
        <View style={styles.rowMeta}>
          <Text style={[styles.rowCategory, { color: badge.text }]}>{item.category}</Text>
          <Text style={[styles.rowDot, { color: colors.textSecondary }]}>·</Text>
          <Text style={[styles.rowDate, { color: colors.textSecondary }]}>{formatDate(item.date)}</Text>
        </View>
      </View>

      <Text style={[styles.rowAmount, { color: colors.textPrimary }]}>{formatCurrency(item.amount)}</Text>
    </TouchableOpacity>
  );
}

export default function ExpensesScreen() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { colors, shadow } = useTheme();

  const filters: ExpenseFilters = {};
  if (search) filters.search = search;

  const { data, loading, error, refetch, deleteExpense } = useExpenses(filters, page);

  function handleDelete(id: string) {
    deleteExpense(id).catch(() => Alert.alert("Error", "Failed to delete expense"));
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Search bar */}
      <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search expenses..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={(v) => { setSearch(v); setPage(1); }}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(""); setPage(1); }} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExpenseRow item={item} onDelete={handleDelete} colors={colors} shadow={shadow} />
        )}
        refreshing={loading}
        onRefresh={refetch}
        contentContainerStyle={
          (data?.data ?? []).length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No expenses found</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          data && data.totalPages > 1 ? (
            <View style={styles.pagination}>
              <TouchableOpacity
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={[styles.pageBtn, { borderColor: colors.border, backgroundColor: colors.surface }, page === 1 && styles.pageBtnDisabled]}
              >
                <Ionicons name="chevron-back" size={16} color={page === 1 ? colors.textSecondary : colors.accent} />
                <Text style={[styles.pageBtnText, { color: page === 1 ? colors.textSecondary : colors.accent }]}>Prev</Text>
              </TouchableOpacity>
              <Text style={[styles.pageInfo, { color: colors.textSecondary }]}>
                {page} / {data.totalPages}
              </Text>
              <TouchableOpacity
                onPress={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages}
                style={[styles.pageBtn, { borderColor: colors.border, backgroundColor: colors.surface }, page >= data.totalPages && styles.pageBtnDisabled]}
              >
                <Text style={[styles.pageBtnText, { color: page >= data.totalPages ? colors.textSecondary : colors.accent }]}>Next</Text>
                <Ionicons name="chevron-forward" size={16} color={page >= data.totalPages ? colors.textSecondary : colors.accent} />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {loading && !data && (
        <ActivityIndicator style={styles.spinner} color={colors.accent} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  searchWrap: {
    padding: tokens.spacing.md,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.sm,
    height: 40,
  },
  searchIcon: { marginRight: tokens.spacing.xs },
  searchInput: { flex: 1, fontSize: 15, height: 40 },

  errorText: { color: tokens.colors.error, textAlign: "center", margin: tokens.spacing.md },

  listContent: { padding: tokens.spacing.md, paddingBottom: tokens.spacing.xl },
  emptyContainer: { flex: 1 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    gap: tokens.spacing.sm,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: tokens.radii.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  badgeText: { fontSize: 16, fontWeight: "700" },
  rowBody: { flex: 1, gap: 3 },
  rowDesc: { fontSize: 15, fontWeight: "600", letterSpacing: -0.2 },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowCategory: { fontSize: 12, fontWeight: "600" },
  rowDot: { fontSize: 12 },
  rowDate: { fontSize: 12 },
  rowAmount: { fontSize: 15, fontWeight: "700", letterSpacing: -0.3 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: tokens.spacing.md, paddingTop: 80 },
  emptyText: { fontSize: 15 },

  spinner: { position: "absolute", top: "50%", alignSelf: "center" },

  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: tokens.spacing.sm,
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, fontWeight: "600" },
  pageInfo: { fontSize: 13 },
});
