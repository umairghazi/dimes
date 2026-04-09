import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { authApi } from "@/api/auth.api";
import { setAccessToken } from "@/api/client";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/theme/useTheme";
import * as secureStorage from "@/store/secureStorage";
import { tokens } from "@/theme/tokens";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const { colors } = useTheme();

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      const data = await authApi.login(email.trim(), password);
      setAccessToken(data.accessToken);
      await secureStorage.setItem("refreshToken", data.refreshToken);
      setUser(data.user);
      router.replace("/(app)");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Dimes</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to your account</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }]}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }]}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>

        <Link href="/(auth)/register" style={[styles.link, { color: colors.accent }]}>
          Don't have an account? Register
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: tokens.spacing.lg, gap: tokens.spacing.md },
  title: { fontSize: 32, fontWeight: "700", color: tokens.colors.accent, textAlign: "center" },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: tokens.spacing.sm },
  input: { borderWidth: 1, borderRadius: tokens.radii.md, padding: tokens.spacing.md, fontSize: 16 },
  button: { backgroundColor: tokens.colors.accent, borderRadius: tokens.radii.md, padding: tokens.spacing.md, alignItems: "center", marginTop: tokens.spacing.sm },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: tokens.colors.error, textAlign: "center", fontSize: 14 },
  link: { textAlign: "center", fontSize: 14 },
});
