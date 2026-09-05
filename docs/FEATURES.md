# Dimes — Feature Tracker

Status legend: ✅ Done · 🚧 In progress · ⬜ Not started

This branch is the Supabase + Google Sheets direction. MongoDB, Prisma, custom auth, CSV upload, AI classification, and DB-backed finance features have been removed from this branch.

---

## Core

| Feature | Status | Notes |
| --- | --- | --- |
| Supabase auth — login, register, session restore | ✅ | Frontend uses Supabase Auth directly; backend verifies Supabase bearer tokens with the service-role client |
| Private Google Sheets data source | ✅ | Backend reads the configured private spreadsheet using service-account auth |
| Finance API | ✅ | `GET /finance/status` and `GET /finance/transactions` are the only finance endpoints |
| Sheet-backed Ledger page | 🚧 | `/ledger` shows Expenses and Income from Google Sheets read-only; write-back is not implemented yet |
| Sheet-backed Monthly Summary page | 🚧 | `/` summarizes income, expenses, net savings, category spend, and main-category spend from the Transactions tab |
| Minimal app shell | ✅ | Navigation is reduced to Summary and Ledger; theme toggle and Supabase sign-out are available |

---

## Removed From This Branch

| Area | Status | Notes |
| --- | --- | --- |
| MongoDB / Prisma persistence | ✅ | Removed backend Prisma schema, DB config, repositories, services, and Prisma package dependencies |
| Custom JWT auth | ✅ | Removed custom auth routes/services and refresh-cookie flow |
| DB-backed expenses/categories/budgets/balances | ✅ | Removed old backend routes and frontend pages/hooks/API clients |
| CSV upload and staging | ✅ | Removed old upload UI and backend import/classification flow |
| AI providers and natural language query | ✅ | Removed old AI provider code and NL query UI/API |

---

## Next

| Feature | Status | Notes |
| --- | --- | --- |
| Google Sheets write-back | ⬜ | Add/update/delete ledger rows directly in the Transactions tab |
| Sheet connection config in Supabase | ⬜ | Move spreadsheet ID, tab names, and ranges out of env into per-user Supabase records |
| Sheet-backed budgets/plans | ⬜ | Read planned expense/income and starting/ending balances from configured sheet ranges |
| Main-category/category charts | ⬜ | Add visual charts from sheet transactions once the core data flow is stable |
