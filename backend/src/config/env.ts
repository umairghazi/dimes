import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  AUTH_PROVIDER: z.enum(["legacy", "supabase", "hybrid"]).default("legacy"),
  ENCRYPTION_MASTER_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173,http://localhost:8081,http://localhost:19006"),
  AI_PROVIDER: z
    .enum(["anthropic", "openai", "google", "bedrock", "local"])
    .default("anthropic"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-5"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o"),
  GOOGLE_API_KEY: z.string().optional(),
  GOOGLE_MODEL: z.string().default("gemini-1.5-pro"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_BEDROCK_MODEL: z.string().default("anthropic.claude-3-5-sonnet"),
  LOCAL_AI_BASE_URL: z.string().default("http://localhost:11434/v1"),
  LOCAL_AI_MODEL: z.string().default("llama3.2"),
  LOCAL_AI_API_KEY: z.string().default("ollama"),
  DATA_SOURCE_PROVIDER: z.enum(["db", "google-sheets"]).default("db"),
  GOOGLE_SHEETS_AUTH_MODE: z.enum(["service-account"]).default("service-account"),
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().optional(),
  GOOGLE_SHEETS_TRANSACTIONS_TAB: z.string().default("Transactions"),
  GOOGLE_SHEETS_TRANSACTIONS_RANGE: z.string().default("A:Z"),
  GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL: z.string().email().optional(),
  GOOGLE_SHEETS_PRIVATE_KEY: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
