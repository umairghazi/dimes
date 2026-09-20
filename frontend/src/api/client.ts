import axios from "axios";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { beginActivity } from "@/store/activityStore";

const requests = new WeakMap<object, () => void>();

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(async (config) => {
  const finish = beginActivity();
  requests.set(config, finish);
  try {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  useAuthStore.getState().setSession(data.session);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
  } catch (error) {
    finish();
    requests.delete(config);
    throw error;
  }
});

apiClient.interceptors.response.use(
  (res) => {
    requests.get(res.config)?.();
    requests.delete(res.config);
    return res;
  },
  (err) => {
    if (err.config) {
      requests.get(err.config)?.();
      requests.delete(err.config);
    }
    if (err.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      void supabase.auth.signOut();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);
