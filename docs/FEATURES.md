# Dimes — Feature Tracker

Status legend: ✅ Done · 🚧 In progress · ⬜ Not started

---

## Core

| Feature | Status | Notes |
| --- | --- | --- |
| Auth — login, register, logout, token refresh | ✅ | httpOnly refresh cookie + access token in memory |
| Expenses — list, filter, create, edit, delete, paginate | ✅ | |
| CSV upload — column mapping, staging review, confirm/discard | ✅ | |
| Async AI classification via SSE | ✅ | Progress bar during classification |
| Categories — CRUD with parent groups | ✅ | |
| Budgets — merged into Categories page, inline budget per category | ✅ | Per-month limit with progress bar |
| Budget carry-forward | ✅ | Repeat toggle on each category card; auto-rolls over on page load via `POST /budgets/rollover` |
| Analytics — monthly summary, 6-month trend, donut, bar chart | ✅ | Merged into Dashboard; month picker controls all data |
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
| Remove dead `CategoryManager` from Settings page | ⬜ | Superseded by the Categories page |
| Fix expense pagination count | ⬜ | `count={totalPages * 20}` is approximate; use actual `total` from API |
| Apply currency preference to all `$` displays | ⬜ | Preference is stored but most displays are hardcoded |
| Backend caching — in-memory TTL cache + MongoDB indexes | ✅ | Analytics (1hr TTL), budgets (4hr), categories (8hr), recurring (4hr); invalidated on writes; 5 DB indexes added; getTrends parallelized |
| Frontend caching — TanStack Query | ✅ | Categories (staleTime: Infinity), budgets (10min), analytics (5min), expenses (2min); mutations invalidate relevant query keys |
| Drill-down drawer | ✅ | Click any chart or budget table row → slide-in drawer showing transactions for that category/month; "Open in Expenses" pre-fills filters and navigates |

---

## Real Gaps (meaningful features not yet built)

| Feature | Status | Notes |
| --- | --- | --- |
| Income tracking | ⬜ | Analytics separates income but there's no way to record it. QuickAdd and CSV only capture debits |
| Budget progress on Dashboard | ⬜ | Budget vs Actual exists on Analytics page; a summary widget on Dashboard would surface it faster |
| Recurring transactions UI | ⬜ | `isRecurring` flag in data model, `getRecurringTransactions` on backend — nothing in UI |
| Description text search in Expenses filter | ✅ | Case-insensitive contains search on description; debounced 300ms in FilterBar |
| AI insights | ✅ | Card at top of Analytics page; manual trigger only (Generate button), resets on month change |

---

## Not Built Yet

| Feature | Status | Notes |
| --- | --- | --- |
| CSV export | ⬜ | Export filtered expenses as CSV |
| History-based classification (reduce AI costs) | ⬜ | See plan below |

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
