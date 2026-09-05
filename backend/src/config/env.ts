import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173,http://localhost:8081,http://localhost:19006"),
  DATA_SOURCE_PROVIDER: z.literal("google-sheets").default("google-sheets"),
  GOOGLE_SHEETS_AUTH_MODE: z.enum(["service-account"]).default("service-account"),
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().min(1, "GOOGLE_SHEETS_SPREADSHEET_ID is required"),
  GOOGLE_SHEETS_TRANSACTIONS_TAB: z.string().default("Transactions"),
  GOOGLE_SHEETS_TRANSACTIONS_RANGE: z.string().default("A:Z"),
  GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL: z.string().email("GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL is required"),
  GOOGLE_SHEETS_PRIVATE_KEY: z.string().min(1, "GOOGLE_SHEETS_PRIVATE_KEY is required"),
  SUPABASE_URL: z.string().url("SUPABASE_URL is required"),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
