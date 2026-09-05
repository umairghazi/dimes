# Dimes

Track your dimes. Every one counts.

Dimes is now a lightweight interface over a private Google Sheet. Supabase handles app authentication, and the Google Sheet is the finance data source.

## Stack

- **Frontend** - React 19, MUI, Zustand, TanStack Query, Vite
- **Backend** - Node.js, Express, Supabase Auth verification
- **Finance data** - Private Google Sheets via service-account access

## Data Model

The backend reads the configured `Transactions` tab and normalizes rows into:

```ts
{
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  mainCategory: string;
  type: "expense" | "income";
}
```

Expected sheet headers:

```text
Date | Description | Amount | Category | Main Category | Type | ID
```

`Type` should be `expense` or `income`. If omitted, rows are treated as expenses.

## Setup

```bash
npm install
```

Create a Google Cloud service account, enable the Google Sheets API, and share the private spreadsheet with the service account email.

### Backend Env

`backend/.env`

```env
PORT=3000
CLIENT_ORIGIN=http://localhost:5173

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

DATA_SOURCE_PROVIDER=google-sheets
GOOGLE_SHEETS_AUTH_MODE=service-account
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SHEETS_TRANSACTIONS_TAB=Transactions
GOOGLE_SHEETS_TRANSACTIONS_RANGE=A:Z
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Frontend Env

`frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Run

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Routes

- `/` - monthly summary calculated from Google Sheets transactions
- `/ledger` - read-only transaction ledger from Google Sheets
- `/login` and `/register` - Supabase auth

## Backend API

- `GET /health`
- `GET /finance/status`
- `GET /finance/transactions?month=YYYY-MM&type=expense`
