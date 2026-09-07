# Architecture

Dimes now has one product path: Supabase-backed finance data with a spreadsheet-style frontend.

## Runtime

```text
React/Vite frontend
  -> Supabase Auth for browser session
  -> Express API with Supabase bearer-token verification
  -> Supabase Postgres finance tables
```

## Backend

- `backend/src/app.ts` mounts `/health` and `/finance`.
- `backend/src/middleware/auth.middleware.ts` verifies Supabase access tokens.
- `backend/src/repositories/finance.repository.ts` owns all Postgres access through the Supabase service-role client.
- `backend/supabase/migrations/001_initial_finance_schema.sql` defines the schema and RLS policies.

## Frontend

- `/` renders `Monthly Summary`.
- `/ledger` renders the spreadsheet-style expense and income tables.
- `frontend/src/api/finance.api.ts` is the only finance API client.
- `frontend/src/store/monthStore.ts` owns month navigation shared by Summary and Ledger.

## Data Shape

Core tables:

- `transactions`
- `categories`
- `monthly_plans`
- `monthly_balances`
- `user_profiles`
