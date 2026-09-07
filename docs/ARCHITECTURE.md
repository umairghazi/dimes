# Architecture

Dimes now has one product path: Supabase-backed finance data with a spreadsheet-style frontend.

## Runtime

```text
React/Vite frontend
  -> Supabase Auth for browser session
  -> Express API with Supabase bearer-token verification
  -> Parameterized SQL against Supabase Postgres finance tables
```

## Backend

- `backend/src/app.ts` mounts `/health` and `/finance`.
- `backend/src/middleware/auth.middleware.ts` verifies Supabase access tokens.
- Controllers parse HTTP input and return HTTP responses.
- Services own business rules and orchestration.
- Repositories own persistence and extend `backend/src/repositories/BaseRepository.ts`.
- `BaseRepository` owns parameterized `pg` query execution and shared error wrapping.
- Supabase SDK usage is limited to Auth/session verification; finance persistence uses explicit SQL.
- `backend/supabase/migrations/001_initial_finance_schema.sql` defines the schema and RLS policies.

Current backend layers:

```text
routes/finance.routes.ts
  -> controllers/finance.controller.ts
  -> services/transaction.service.ts
  -> services/category.service.ts
  -> services/monthlySummary.service.ts
  -> repositories/transaction.repository.ts
  -> repositories/category.repository.ts
  -> repositories/monthlyPlan.repository.ts
  -> repositories/monthlyBalance.repository.ts
  -> repositories/BaseRepository.ts
```

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
