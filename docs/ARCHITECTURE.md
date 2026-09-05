# Dimes Architecture

This branch is intentionally small.

```text
React frontend
  -> Supabase Auth session
  -> Express backend
  -> private Google Sheets API
```

## Source Of Truth

Google Sheets is the finance source of truth. The backend reads the configured `Transactions` tab with a service account and normalizes rows for the frontend.

Supabase is the identity provider. The frontend signs users in with Supabase Auth. The backend verifies Supabase bearer tokens before serving finance data.

## Backend

```text
backend/src/
  app.ts
  server.ts
  config/
  controllers/finance.controller.ts
  dataSources/
    FinanceDataSource.ts
    FinanceDataSourceFactory.ts
    GoogleSheetsFinanceDataSource.ts
    filterFinanceTransactions.ts
  integrations/supabase/supabaseAdmin.client.ts
  middleware/
  routes/finance.routes.ts
```

Available routes:

```text
GET /health
GET /finance/status
GET /finance/transactions?month=YYYY-MM&type=expense
```

## Frontend

```text
frontend/src/
  api/finance.api.ts
  api/client.ts
  lib/supabase/client.ts
  pages/Auth/
  pages/Ledger/
  pages/Summary/
  components/layout/
  components/ledger/
  store/authStore.ts
  store/monthStore.ts
  store/themeStore.ts
```

Available app routes:

```text
/login
/register
/
/ledger
```

## Transaction Shape

```ts
{
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  mainCategory: string;
  type: "expense" | "income";
  source: "google-sheets";
}
```
