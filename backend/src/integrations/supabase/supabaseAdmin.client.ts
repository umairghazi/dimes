import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "../../config/env";
import { AppError } from "../../errors/AppError";

let client: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (client) return client;

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new AppError("Supabase auth is not configured", 503, "SUPABASE_NOT_CONFIGURED");
  }

  client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
}
