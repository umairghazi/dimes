import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type TextInput as TextInputType,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCategories } from "@/hooks/useCategories";
import { useTheme } from "@/theme/useTheme";
import { expensesApi } from "@/api/expenses.api";
import { tokens } from "@/theme/tokens";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

export default function AddExpenseScreen() {
  const [mode, setMode] = useState<"expense" | "income">("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const amountRef = useRef<TextInputType>(null);
  const { categories, loading: catsLoading } = useCategories();
  const { colors, shadow } = useTheme();

  const filteredCategories = categories.filter(
    (c) => (c.type ?? "expense") === mode,
  );

  const inputStyle = [styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }];

  async function handleSubmit() {
    if (!description.trim()) return Alert.alert("Validation", "Description is required");
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return Alert.alert("Validation", "Enter a valid amount");
    if (!categoryId) return Alert.alert("Validation", "Select a category");
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) return Alert.alert("Validation", "Date must be YYYY-MM-DD");

    setSubmitting(true);
    try {
      await expensesApi.create({
        description: description.trim(),
        amount: parsed,
        date,
        type: mode,
        categoryId: categoryId || null,
        currency: "USD",
        source: "manual",
        isRecurring: false,
        tags: [],
      });
      router.replace("/(app)/expenses");
    } catch {
      Alert.alert("Error", "Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Expense / Income toggle */}
        <View style={[styles.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === "expense" && { backgroundColor: colors.accent }]}
            onPress={() => { setMode("expense"); setCategoryId(""); setCategoryName(""); }}
          >
            <Text style={[styles.toggleBtnText, { color: mode === "expense" ? "#fff" : colors.textSecondary }]}>
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === "income" && { backgroundColor: "#16a34a" }]}
            onPress={() => { setMode("income"); setCategoryId(""); setCategoryName(""); }}
          >
            <Text style={[styles.toggleBtnText, { color: mode === "income" ? "#fff" : colors.textSecondary }]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount — large prominent input */}
        <TouchableOpacity
          style={[styles.amountCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}
          onPress={() => amountRef.current?.focus()}
          activeOpacity={0.8}
        >
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>AMOUNT</Text>
          {/* Hidden input captures keyboard; display Text shows formatted value */}
          <TextInput
            ref={amountRef}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={styles.hiddenInput}
          />
          <Text style={[styles.amountDisplay, { color: amount ? colors.textPrimary : colors.textSecondary }]}>
            {amount ? `$${amount}` : "$0.00"}
          </Text>
        </TouchableOpacity>

        {/* Other fields */}
        <View style={[styles.fieldsCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}>
          <Field label="Description">
            <TextInput
              style={inputStyle}
              placeholder="e.g. Coffee at Starbucks"
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
            />
          </Field>

          <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

          <Field label="Date">
            <TextInput
              style={inputStyle}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              value={date}
              onChangeText={setDate}
            />
          </Field>

          <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

          <Field label="Category">
            <TouchableOpacity
              style={[inputStyle, styles.pickerRow]}
              onPress={() => setPickerVisible(true)}
            >
              <Text style={{ fontSize: 15, color: categoryName ? colors.textPrimary : colors.textSecondary, flex: 1 }}>
                {categoryName || "Select category..."}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </Field>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>{mode === "income" ? "Save Income" : "Save Expense"}</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>

      {/* Category picker modal */}
      <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{mode === "income" ? "Income Category" : "Category"}</Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)} style={styles.modalDone}>
              <Text style={[styles.modalDoneText, { color: colors.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>

          {catsLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.catList}
              renderItem={({ item }) => {
                const selected = categoryId === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.catRow,
                      { borderBottomColor: colors.border },
                      selected && { backgroundColor: colors.accentBg },
                    ]}
                    onPress={() => { setCategoryId(item.id); setCategoryName(item.name); setPickerVisible(false); }}
                  >
                    <View style={styles.catRowInner}>
                      <View>
                        {item.group && (
                          <Text style={[styles.catGroupLabel, { color: colors.textSecondary }]}>{item.group}</Text>
                        )}
                        <Text style={[styles.catItemName, { color: selected ? colors.accent : colors.textPrimary }, selected && { fontWeight: "700" }]}>
                          {item.name}
                        </Text>
                      </View>
                      {selected && <Ionicons name="checkmark" size={18} color={colors.accent} />}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.catEmpty}>
                  <Text style={[styles.catEmptyText, { color: colors.textSecondary }]}>
                    No categories yet. Add them in the web app.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: tokens.spacing.md, gap: tokens.spacing.md, paddingBottom: tokens.spacing.xl },

  amountCard: {
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    padding: tokens.spacing.lg,
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: tokens.spacing.sm,
    textAlign: "center",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  amountDisplay: {
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1,
    textAlign: "center",
  },

  fieldsCard: {
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  field: { padding: tokens.spacing.md, gap: tokens.spacing.xs },
  fieldLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  fieldDivider: { height: 1 },
  input: {
    borderWidth: 1,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    fontSize: 15,
    minHeight: 44,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  toggleRow: {
    flexDirection: "row",
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: tokens.spacing.sm,
    alignItems: "center",
  },
  toggleBtnText: { fontSize: 14, fontWeight: "600" },

  submitBtn: {
    backgroundColor: tokens.colors.accent,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalDone: { padding: tokens.spacing.xs },
  modalDoneText: { fontSize: 16, fontWeight: "600" },
  catList: { paddingBottom: tokens.spacing.xl },
  catRow: { borderBottomWidth: 1 },
  catRowInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  },
  catGroupLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 },
  catItemName: { fontSize: 16 },
  catEmpty: { padding: tokens.spacing.xl, alignItems: "center" },
  catEmptyText: { textAlign: "center", fontSize: 14 },
});
