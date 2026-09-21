import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinanceContext } from "./financeContext";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
      supabase?: SupabaseClient;
      finance: FinanceContext;
    }
  }
}

export {};
