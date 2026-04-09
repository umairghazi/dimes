import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { setAccessToken } from "@/api/client";
import * as secureStorage from "@/store/secureStorage";

const queryClient = new QueryClient();
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const scheme = useColorScheme();

  useEffect(() => {
    (async () => {
      try {
        const refreshToken = await secureStorage.getItem("refreshToken");
        if (refreshToken) {
          const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
            `${BASE_URL}/auth/refresh`,
            { refreshToken },
          );
          setAccessToken(data.accessToken);
          await secureStorage.setItem("refreshToken", data.refreshToken);
          const payload = JSON.parse(atob(data.accessToken.split(".")[1]));
          setUser({ id: payload.sub, email: payload.email });
        }
      } catch {
        await secureStorage.deleteItem("refreshToken");
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
