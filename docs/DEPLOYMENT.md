# Deployment

## Required Services

- Supabase project for auth
- Private Google Sheet for finance data
- Google Cloud service account with Sheets API access

## Backend Env

```env
PORT=3000
CLIENT_ORIGIN=https://your-frontend-origin

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

DATA_SOURCE_PROVIDER=google-sheets
GOOGLE_SHEETS_AUTH_MODE=service-account
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SHEETS_TRANSACTIONS_TAB=Transactions
GOOGLE_SHEETS_TRANSACTIONS_RANGE=A:Z
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SHEETS_PRIVATE_KEY=
```

## Frontend Env

```env
VITE_API_BASE_URL=https://your-backend-origin
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Google Sheet Access

Share the spreadsheet directly with the service account email. The sheet does not need to be public.
