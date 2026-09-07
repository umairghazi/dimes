# Dimes Feature Tracker

Status legend: Done, In progress, Not started

## Current Direction

This branch is the Supabase database direction. Google Sheets is no longer the data source, and the old MongoDB/AI/upload app surface has been removed from the active codebase.

## Core

| Feature | Status | Notes |
| --- | --- | --- |
| Supabase Auth | Done | Frontend uses Supabase login/register/session restore; backend verifies Supabase bearer tokens |
| Supabase Postgres schema | Done | SQL migration defines profiles, categories, transactions, monthly plans, and monthly balances with RLS |
| Finance API | Done | `/finance` exposes transactions, categories, and monthly summary |
| Backend service/repository layering | Done | Controllers call services; table-specific repositories extend `BaseRepository` for shared Supabase behavior |
| Monthly Summary | In progress | Default route mirrors the spreadsheet summary shape using Supabase data |
| Ledger | In progress | Spreadsheet-style expense/income tables read and write Supabase transactions |
| Minimal navigation | Done | Visible app navigation is reduced to Summary and Ledger |

## Removed

| Area | Status | Notes |
| --- | --- | --- |
| MongoDB / Prisma runtime | Done | Server no longer connects to MongoDB or mounts Mongo-backed routes |
| Custom JWT auth | Done | Removed backend auth routes/services and frontend auth API client |
| AI classification and natural language query | Done | Removed AI providers, prompts, query UI, and dependencies |
| CSV upload/staging | Done | Removed upload routes, staging code, UI, and dependencies |
| Legacy dashboard/analytics/settings pages | Done | Removed unused frontend pages/components from this branch |
| Mobile app | Done | Removed React Native app from this branch |

## Next

| Feature | Status | Notes |
| --- | --- | --- |
| Seed/import existing spreadsheet data | Not started | Add a simple Supabase import path for current transactions, categories, plans, and balances |
| Editable monthly plans | Not started | Let Summary update planned expense/income values |
| Editable monthly balances | Not started | Let Summary update starting and ending bank balances |
| Category management in ledger | Not started | Add lightweight category creation/editing without bringing back the old settings surface |
