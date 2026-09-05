# Project Plan

## Direction

Dimes is a focused interface over a private Google Sheet.

- Supabase handles authentication.
- Google Sheets holds finance data.
- The backend normalizes sheet data for the frontend.

## Current Milestone

Read-only sheet-backed app:

- Supabase login/register/session restore
- Backend bearer-token verification
- Private Google Sheets transaction reads
- Monthly summary from sheet transactions
- Ledger view from sheet transactions

## Next Milestones

1. Add Google Sheets write-back for transaction create/update/delete.
2. Move sheet connection config from environment variables into Supabase tables.
3. Read planned budgets, income plans, and balances from sheet ranges.
4. Add charts for spend by date, category, and main category.
5. Add server-side sheet snapshot caching.

## Non-Goals On This Branch

- App-owned finance database
- Custom password/auth implementation
- AI classification
- CSV import staging
- Natural language queries
