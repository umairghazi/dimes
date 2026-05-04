# Dimes — Feature Tracker

Status legend: ✅ Done · 🚧 In progress · ⬜ Not started

---

## Core

| Feature | Status | Notes |
| --- | --- | --- |
| Auth — login, register, logout, token refresh | ✅ | httpOnly refresh cookie + access token in memory |
| Expenses — list, filter, create, edit, delete, paginate | ✅ | Category stored as `categoryId` FK; name resolved at read time; `type: "expense"\|"income"` replaces `isIncome` boolean; income has proper categories |
| CSV upload — column mapping, staging review, confirm/discard | ✅ | Inline description editing + transaction splitting added to staging review |
| Paste from bank — heuristic TSV/CSV parser, staging review | ✅ | Detects headers by keyword, handles debit/credit columns or signed amount, skips credit/income rows with count shown; feeds into same staging + classify pipeline |
| Async AI classification via SSE | ✅ | Progress bar during classification |
| Categories — CRUD with parent groups | ✅ | |
| Budgets — merged into Categories page, inline budget per category | ✅ | Per-month limit with progress bar |
| Budget carry-forward | ✅ | Repeat toggle on each category card; auto-rolls over on page load via `POST /budgets/rollover` |
| Analytics — monthly summary, 6-month trend, donut, bar chart | ✅ | Single scrolling page (no tabs); 4 sections: Monthly Statement (BalanceStrip), Where it went (Pareto/MoM/Merchants/Fixed-Variable), Budget (recommendations + table + rebalancer collapsed), Over time (trend + AI insight collapsed); SpendingPaceCard moved to Dashboard (current month only) |
| Budget vs Actual table | ✅ | On Dashboard; planned/actual/diff per category with totals row; toggle to hide $0 rows |
| NL query bar — ask and add modes | ✅ | |
| Dashboard — stat cards, donut, trend, NL bar | ✅ | |
| Settings — theme (dark/light), currency preference | ✅ | |
| Quick Add — FAB, sheet/dialog for manual expense entry | ✅ | |
| Categories compact view | ✅ | Dense table view (collapsible groups, inline budget edit, hover actions); toggle between card/table view, persisted to localStorage |

---

## Quick Wins (small effort, clear value)

| Feature | Status | Notes |
| --- | --- | --- |
| Remove dead `CategoryManager` from Settings page | ✅ | Deleted — superseded by the Categories page |
| Fix expense pagination count | ⬜ | `count={totalPages * 20}` is approximate; use actual `total` from API |
| Apply currency preference to all `$` displays | ⬜ | Preference is stored but most displays are hardcoded |
| Backend caching — in-memory TTL cache + MongoDB indexes | ✅ | Analytics (1hr TTL), budgets (4hr), categories (8hr), recurring (4hr); invalidated on writes; 5 DB indexes added; getTrends parallelized |
| Frontend caching — TanStack Query | ✅ | Categories (staleTime: Infinity), budgets (10min), analytics (5min), expenses (2min); mutations invalidate relevant query keys |
| Drill-down drawer | ✅ | Click any chart or budget table row → slide-in drawer showing transactions for that category/month; "Open in Expenses" pre-fills filters and navigates |

---

## Real Gaps (meaningful features not yet built)

| Feature | Status | Notes |
| --- | --- | --- |
| Income tracking | ✅ | QuickAdd has Expense/Income toggle; income stored via `type: "income"` with real `categoryId` from UserCategory; `UserCategory.type` field ("expense"\|"income"\|null) now separates income vs expense categories; CategorySelect filters by mode; Expenses page defaults to expense-only view with Expenses/Income toggle in FilterBar |
| Budget progress on Dashboard | ⬜ | Budget vs Actual exists on Analytics page; a summary widget on Dashboard would surface it faster |
| Budget Rebalancer | ✅ | When over budget in any category, shows proportional cut suggestions across categories with remaining slack; current month only |
| Recurring transactions UI | ⬜ | `isRecurring` flag in data model, `getRecurringTransactions` on backend — nothing in UI |
| Description text search in Expenses filter | ✅ | Case-insensitive contains search on description; debounced 300ms in FilterBar |
| AI insights | ✅ | Card at top of Analytics page; manual trigger only (Generate button), resets on month change |
| Spending insights — Pareto, MoM deltas, savings rate | ✅ | Insights tab: stat cards (spend/savings rate/income), Pareto card (80% rule with stacked bar), MoM category changes with trend arrows; all clickable → drill-down drawer |
| Top merchants | ✅ | Ranked by total spend with bar gauges and transaction count; descriptions normalized (strip store numbers/punctuation) |
| Spending pace | ✅ | Current month only: daily average, projected month-end total, projected savings/shortfall vs income; warning border when over budget |
| Budget recommendations | ✅ | Current month only: 3-month average per category, surfaces unbudgeted categories sorted by spend; one-click "Set $X" creates budget and removes suggestion; rounded up to nearest $25 |
| Fixed vs Variable split | ✅ | Pin icon on each category in compact view marks it as fixed; Analytics Insights tab shows fixed/variable totals with split bar; variable categories ranked by spend with "−10% = $X" savings chips and a "trim top 3" summary |

---

## Not Built Yet

| Feature | Status | Notes |
| --- | --- | --- |
| Monthly balance reconciliation | ✅ | `MonthlyBalance` model; user enters starting balance (and optional actual ending balance); computed ending = start + income − spent; shows savings two ways (income-based vs bank-change); discrepancy warning when they diverge; editable any time via Analytics Insights tab |
| CSV export | ⬜ | Export filtered expenses as CSV |
| History-based classification (reduce AI costs) | ✅ | Two-tier: history pre-match (free, instant) → AI fallback only for unknowns; confidence 95%/80% by match count; "History"/"AI" badges in staging review |
| Duplicate detection on CSV import | ⬜ | Pre-confirm warning when imported rows match existing expenses (same userId + date + amount + description); prevents silent data doubling on re-upload |
| Mobile Analytics tab | ✅ | Full Analytics tab: stat cards (spend/income/savings rate), spending pace, 80/20 Pareto, MoM changes, top merchants, fixed vs variable split |
| Mobile filter parity | 🚧 | Expense/Income toggle added (defaults to expenses); text search remains; category + date range filters still missing |
| Budget alert surfacing | ⬜ | `alertThreshold` is stored and compared in `getBudgetProgress` but never shown in UI; add banner/badge on Dashboard when a budget is near or over threshold |
| Orphaned expense re-categorization | ⬜ | Deleting a category silently turns its expenses to "Uncategorized"; add a bulk re-assign flow at delete time |
| AI insights auto-trigger | ⬜ | Insights are manual-trigger only; cache per `userId+monthYear` so closed months auto-load without re-generating |

---

## Plan: History-based AI Classification

### Problem
Every CSV upload sends all transactions to the AI provider. Over time the user builds up a labeled dataset (confirmed expenses) that goes unused — the same merchant gets classified by AI on every upload.

### Approach: Two-tier classification

**Tier 1 — History lookup (free, instant)**

Before any transaction touches AI:
1. Pull user's expense history from MongoDB (description + final category)
2. Normalize descriptions: lowercase, strip store numbers/branch IDs/punctuation (`WALMART #1234 SC` → `walmart`)
3. Match incoming transactions against normalized history
4. Score confidence:
   - User-corrected match → 1.0, skip AI
   - AI-classified match, seen 5+ times → 0.95, skip AI
   - AI-classified match, seen 1–4 times → 0.80, skip AI (amber in staging)
   - No match → send to AI

**Tier 2 — AI (fallback only)**

Only unmatched transactions go to the AI batch. As history grows, this batch shrinks.

### Expected savings

| Stage | AI calls saved |
| --- | --- |
| First upload | 0% (no history yet) |
| After 2–3 months | ~60–80% |
| Long-term | ~90%+ (recurring bills, groceries, gas repeat constantly) |

### Code changes

| Layer | Change |
| --- | --- |
| `ExpenseRepository` | New `getClassificationHistory(userId)` — aggregate normalized description → `{ category, count, isUserCorrected }` |
| `ClassificationRepository` | `classify()` checks history first, only sends unmatched transactions to AI |
| `StagingExpense` | Add `classificationSource: "history" \| "ai"` field so staging UI can show where each result came from |
| Frontend | No changes needed — confidence colouring in staging already handles it |

---

## Dependency Versions (last updated 2026-04-08)

| Area | Key packages |
| --- | --- |
| Frontend | React 19.2, MUI 9, Vite 7.3, recharts 3.8, react-router-dom 7.14, zustand 5 |
| Backend | Express 5.2, Prisma 6.19 (pinned — Prisma 7 requires MongoDB adapter migration), zod 4, openai SDK 6, multer 2 |
