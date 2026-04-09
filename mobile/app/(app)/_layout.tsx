import { Alert, TouchableOpacity, Text, View, Platform, useWindowDimensions } from "react-native";
import { Redirect, Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/theme/useTheme";
import { tokens } from "@/theme/tokens";
import * as secureStorage from "@/store/secureStorage";
import { setAccessToken } from "@/api/client";

function TabIcon({ name, color, size }: { name: any; color: string; size: number }) {
  return <Ionicons name={name} color={color} size={size} />;
}

function HeaderTitle({ page, textColor }: { page: string; textColor: string }) {
  const { width } = useWindowDimensions();
  const isLarge = width >= 768;
  return (
    <View style={{ alignItems: isLarge ? "flex-start" : "center" }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: tokens.colors.accent, letterSpacing: 1, textTransform: "uppercase" }}>
        Dimes
      </Text>
      <Text style={{ fontSize: 17, fontWeight: "700", color: textColor, letterSpacing: -0.3, lineHeight: 20 }}>
        {page}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { colors, dark } = useTheme();

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  async function doLogout() {
    setAccessToken(null);
    await secureStorage.deleteItem("refreshToken");
    clearAuth();
    router.replace("/(auth)/login");
  }

  function handleLogout() {
    if (Platform.OS === "web") {
      if (window.confirm("Sign out?")) doLogout();
    } else {
      Alert.alert("Sign Out", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: doLogout },
      ]);
    }
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: tokens.colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: () => <HeaderTitle page="Dashboard" textColor={colors.textPrimary} />,
          tabBarIcon: ({ color, size }) => <TabIcon name="grid-outline" color={color} size={size} />,
          tabBarLabel: "Dashboard",
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16, padding: 4 }}>
              <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          headerTitle: () => <HeaderTitle page="Expenses" textColor={colors.textPrimary} />,
          tabBarIcon: ({ color, size }) => <TabIcon name="receipt-outline" color={color} size={size} />,
          tabBarLabel: "Expenses",
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          headerTitle: () => <HeaderTitle page="Add Expense" textColor={colors.textPrimary} />,
          tabBarIcon: ({ color, size }) => <TabIcon name="add-circle-outline" color={color} size={size} />,
          tabBarLabel: "Add",
        }}
      />
    </Tabs>
  );
}
