import axios from "axios";
import { supabase } from "@/lib/supabase/client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
