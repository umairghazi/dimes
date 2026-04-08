# Dimes — Feature Tracker

Status legend: ✅ Done · 🚧 In progress · ⬜ Not started

---

## Core

| Feature | Status | Notes |
|---|---|---|
| Auth — login, register, logout, token refresh | ✅ | httpOnly refresh cookie + access token in memory |
| Expenses — list, filter, create, edit, delete, paginate | ✅ | |
| CSV upload — column mapping, staging review, confirm/discard | ✅ | |
| Async AI classification via SSE | ✅ | Progress bar during classification |
| Categories — CRUD with parent groups | ✅ | |
| Budgets — merged into Categories page, inline budget per category | ✅ | Per-month limit with progress bar |
| Budget carry-forward | ✅ | Repeat toggle on each category card; auto-rolls over on page load via `POST /budgets/rollover` |
| Analytics — monthly summary, 6-month trend, donut, bar chart | ✅ | |
| NL query bar — ask and add modes | ✅ | |
| Dashboard — stat cards, donut, trend, NL bar | ✅ | |
| Settings — theme (dark/light), currency preference | ✅ | |
| Quick Add — FAB, sheet/dialog for manual expense entry | ✅ | |

---

## Quick Wins (small effort, clear value)

| Feature | Status | Notes |
|---|---|---|
| Remove dead `CategoryManager` from Settings page | ⬜ | Superseded by the Categories page |
| Fix expense pagination count | ⬜ | `count={totalPages * 20}` is approximate; use actual `total` from API |
| Apply currency preference to all `$` displays | ⬜ | Preference is stored but most displays are hardcoded |

---

## Real Gaps (meaningful features not yet built)

| Feature | Status | Notes |
|---|---|---|
| Income tracking | ⬜ | Analytics separates income but there's no way to record it. QuickAdd and CSV only capture debits |
| Budget progress on Dashboard | ⬜ | `getBudgetProgress` exists on backend, never called. Show "90% through Groceries with 12 days left" |
| Recurring transactions UI | ⬜ | `isRecurring` flag in data model, `getRecurringTransactions` on backend — nothing in UI |
| Description text search in Expenses filter | ⬜ | FilterBar only filters by category and date range |
| AI insights | ⬜ | `generateInsight` implemented on backend, not exposed via route or shown in UI |

---

## Not Built Yet

| Feature | Status | Notes |
|---|---|---|
| CSV export | ⬜ | Export filtered expenses as CSV |

---

## Dependency Versions (last updated 2026-04-08)

| Area | Key packages |
|---|---|
| Frontend | React 19.2, MUI 9, Vite 7.3, recharts 3.8, react-router-dom 7.14, zustand 5 |
| Backend | Express 5.2, Prisma 6.19 (pinned — Prisma 7 requires MongoDB adapter migration), zod 4, openai SDK 6, multer 2 |
