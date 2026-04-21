# Dimes — Architecture & Design Decisions

Technical decisions, patterns, and non-obvious implementation choices. Intended as a reference for future work and onboarding.

---

## Repo layout

```text
dimes/
├── frontend/src/
│   ├── api/              # Axios call modules (one per domain)
│   │   ├── client.ts     # Axios instance + auth interceptors (silent token refresh on 401)
│   │   ├── analytics.api.ts
│   │   ├── auth.api.ts
│   │   ├── budgets.api.ts
│   │   ├── categories.api.ts
│   │   ├── expenses.api.ts
│   │   ├── query.api.ts
│   │   └── upload.api.ts
│   ├── components/
│   │   ├── shared/       # CategorySelect
│   │   ├── expenses/     # ExpenseTable, ExpenseCardList, FilterBar, CategoryEditCell, ExpenseEditDialog, DrillDownDrawer
│   │   ├── upload/       # ColumnMapper, StagingReviewTable
│   │   ├── charts/       # SpendingDonut, TrendLine, CategoryBarChart, BudgetComparisonTable
│   │   ├── quickAdd/     # QuickAddFAB, QuickAddSheet
│   │   ├── query/        # NLQueryBar, QueryResultCard
│   │   ├── layout/       # AppShell, Sidebar, TopBar, BottomNav
│   │   └── settings/     # CategoryCompactView
│   ├── hooks/            # useExpenses, useUpload, useCategories, useBudgets, useAnalytics, useBreakpoint
│   ├── pages/            # Dashboard, Expenses, Upload, Categories, Analytics, Settings, Auth
│   ├── store/            # Zustand: auth, theme, filter, preferences
│   ├── types/            # expense.types, budget.types, upload.types, category.types, analytics.types
│   └── router/           # AppRouter, ProtectedRoute
│
├── backend/src/
│   ├── ai/
│   │   ├── interfaces/   # IAIProvider, AITypes (RawTransaction, ClassifiedTransaction, …)
│   │   ├── providers/    # Anthropic, OpenAI, Google, AWSBedrock, Local
│   │   ├── prompts/      # classification, intentParsing, insights
│   │   └── AIProviderFactory.ts
│   ├── controllers/      # auth, expense, upload, budget, analytics, query, category
│   ├── routes/           # one file per controller
│   ├── services/         # auth, expense, upload, budget, analytics, nlQuery, category, jobStore
│   ├── repositories/     # user, expense, staging, budget, classification, nlQuery, category
│   ├── base/             # BaseMongoRepository, BaseHttpRepository
│   ├── errors/           # AppError, RepositoryError, HttpRepositoryError
│   ├── middleware/       # auth, error, rateLimiter
│   ├── lib/              # cache.ts (AppCache)
│   ├── types/            # prisma.types, common.types, express.d.ts
│   └── config/           # db, env, logger
│
└── mobile/
    ├── app/
    │   ├── (auth)/       # login, register
    │   └── (app)/        # index (dashboard), expenses, add
    └── src/
        ├── api/          # auth, expenses, categories, analytics
        ├── hooks/        # useExpenses, useCategories, useAnalytics
        ├── store/        # authStore
        ├── theme/        # tokens, useTheme
        └── types/        # expense.types, category.types, analytics.types
```

---

## Database models (current)

### Expense

```text
id                  ObjectId
userId              ObjectId  → User
date                DateTime
description         String
amount              Float
currency            String
categoryId          ObjectId? → UserCategory   (FK; null = uncategorized)
type                String    "expense" | "income"
subCategory         String?
merchantName        String?
source              String    "manual" | "csv-upload"
isRecurring         Boolean
tags                String[]
originalDescription String?
createdAt / updatedAt

Indexes: [userId, date], [userId, isRecurring], [userId, categoryId]
```

### StagingExpense

Temporary holding area for CSV rows awaiting user review.

```text
id                    ObjectId
userId                ObjectId
uploadBatchId         String    UUID grouping all rows from one upload
date                  DateTime
description           String
amount                Float
aiSuggestedCategory   String    category name (resolved to categoryId at confirm)
aiConfidence          Float     0–1; 0 = AI unavailable
userCorrectedCategory String?
classificationSource  String?   "ai" | "history"
status                String    "pending" | "confirmed" | "rejected"
createdAt
```

### UserCategory

```text
id        ObjectId
userId    ObjectId
name      String    full value: "Bill - Electricity", "Groceries", "Paycheck"
group     String?   parent group: "Bill", "Income", null for standalones
sortOrder Int
deletedAt DateTime? soft delete
createdAt / updatedAt

Index: [userId]
```

### Budget

```text
id             ObjectId
userId         ObjectId  → User
category       String    category name
monthYear      String    "YYYY-MM"
limitAmount    Float
currency       String
alertThreshold Float     default 0.8 (80%)
carryForward   Boolean
createdAt / updatedAt

Index: [userId, monthYear]
```

---

## Design Decisions

### 1. Auth — httpOnly cookie + in-memory access token

**Decision:** Refresh token lives in an httpOnly cookie. Access token is kept only in memory (Zustand store, never localStorage).

**Why:** localStorage is readable by any JS on the page (XSS). httpOnly cookies are not. The access token has a short TTL (minutes) and lives only for the lifetime of the browser tab. On cold load, the client hits `POST /auth/refresh` using the cookie to get a new access token. On 401, the Axios response interceptor silently refreshes and retries the original request.

---

### 2. Category storage — ID-only FK, names resolved at read time

**Problem:** Storing category names as strings on every expense means renaming a category silently makes historical data stale. You'd need to backfill every expense row.

**Decision:** Expenses store only `categoryId` (FK to `UserCategory`). The name is never written to the expense document. On read, names are resolved via a two-query batch pattern:

```
1. Fetch expenses
2. Collect unique categoryIds
3. findMany(UserCategory, { id: { in: ids } })
4. Build Map<id, name>, annotate each expense in memory
```

**Performance:** O(n_unique_categories) per request, not O(n_expenses). A typical user has 10–30 categories — the batch fetch is one query regardless of page size.

**Trade-off:** Every expense read needs an extra DB query. Acceptable at personal-finance scale.

---

### 3. Transaction type — enum string, not boolean

**Evolution:** `isIncome: Boolean` → `type: String` (`"expense" | "income"`)

**Why:**
- Boolean isn't extensible — adding "transfer" would require another column
- `isIncome = true` forced `categoryId = null`, blocking income from having proper categories
- Income sources were stored in `subCategory` as a workaround

**Current model:** Income transactions have a real `categoryId` pointing to an income category (e.g. "Paycheck" under an "Income" group in `UserCategory`). The `type` field distinguishes them from expenses in aggregations.

**Analytics:** `aggregateByCategory` returns `type` on each result row so callers filter income vs expense without string-matching category names.

**Migration:** One-time script at `backend/scripts/migrate-income-type.ts` backfills `type` from the old `isIncome` field.

---

### 4. Async AI classification via SSE

**Problem:** AI classification of 50–200 CSV rows takes 5–30 seconds. A synchronous HTTP response that long is fragile (load balancer timeouts, mobile drops).

**Solution:** Two-phase approach:

1. `POST /upload/csv` returns immediately with `{ batchId, jobId }`. All rows are written to MongoDB as `Miscellaneous` synchronously before the response.
2. Classification runs detached (`void runClassification(...)`). Progress is tracked in an in-memory `JobStore` using a pub/sub listener pattern.
3. The client opens `GET /upload/jobs/:jobId/stream` — an SSE connection. The server streams `progress` and `done` events as the job progresses.

**Why SSE over WebSockets:** SSE is unidirectional (server → client), which is all we need. No handshake overhead, works over HTTP/1.1, native `EventSource` browser API.

**Auth workaround:** `EventSource` can't set custom headers (browser limitation). The JWT access token is passed as `?token=` query param for this endpoint only. Accepted trade-off — the token is short-lived.

**Late-joiner handling:** If the client connects after the job is already done, `JobStore` keeps the final state for 5 minutes. The controller checks `job.status` immediately on connect and sends the terminal event without subscribing.

**Known limitation:** `JobStore` is in-process memory. A Node restart mid-job loses the state and the client's SSE stream hangs until browser timeout. Swap `JobStore` for Redis pub/sub to fix for multi-instance deployments.

---

### 5. Two-tier AI classification — history + AI fallback

**Problem:** Every CSV upload sends all transactions to the AI provider, even for merchants the user has categorized dozens of times before.

**Solution:**

- **Tier 1 — History lookup (free, instant):** Before any AI call, fetch the user's confirmed expense history and build a `Map<normalizedDesc, { categoryId, count }>`. Descriptions are normalized: lowercased, punctuation stripped, standalone numbers removed (`"WALMART #1234"` → `"walmart"`). Matching transactions skip AI entirely.
- **Tier 2 — AI fallback:** Only unmatched transactions go to the AI in batches of 50.

**Confidence scoring for history matches:**
- ≥ 3 occurrences → 95%
- 1–2 occurrences → 80%

**Staging UI:** Each row shows a "History" (blue) or "AI" (purple) source badge.

**Expected savings:** ~0% on first upload, ~60–80% after a few months, ~90%+ long-term.

---

### 6. In-memory cache with TTL

A simple `Map<string, { value, expiresAt }>` singleton (`AppCache`) at `backend/src/lib/cache.ts`.

**Cache key format:** `{domain}:{userId}:{type}:{params}`

Example: `analytics:abc123:summary:2026-04`

userId comes **before** the type segment so `delPrefix("analytics:{userId}:")` correctly clears all of a user's analytics keys. Reversing the order (type before userId) would break prefix deletion.

**TTLs:**

| Domain | TTL |
|---|---|
| Analytics | 1 hour |
| Budgets | 4 hours |
| Categories | 8 hours |
| Recurring | 4 hours |

**Invalidation:** All write paths call `cache.delPrefix(...)` or `cache.del(...)` after a successful mutation. No background jobs. Frontend uses TanStack Query (`invalidateQueries`) as a second cache layer — stale times: analytics 5 min, expenses 2 min, budgets 10 min, categories `Infinity`.

**Redis migration path:** The entire cache surface is `cache.ts`. Nothing outside it knows the storage mechanism. Swap the Map for `ioredis` keeping the same four method signatures (`get`, `set`, `del`, `delPrefix`), make them async, and `await` ~20 call sites in the service layer. The service files are already `async` so this is mechanical.

---

### 7. Dependency injection — repos into services only

**Rule:** Only repositories are injected into services. Services are never injected into other services.

**Why:** Service-into-service injection creates hidden coupling and circular dependency risk. If service A needs data that service B computes, A should call the relevant repository directly.

**Pattern:** Controllers instantiate services with their repository dependencies inline. No DI container — manual wiring is explicit and readable at this codebase size.

---

### 8. MongoDB + Prisma — no joins, batch lookup pattern

MongoDB has no native joins. Prisma's MongoDB connector doesn't support `include` across collections the way the SQL connector does.

Multi-collection queries use the batch lookup pattern: fetch primary documents, collect foreign IDs, `findMany` the related collection, build a Map, annotate in memory. This is the pattern used everywhere categories are resolved on expenses.

**Prisma version:** Pinned to 6.x. Prisma 7 requires a MongoDB adapter migration — do not upgrade without reading the migration guide.

---

### 9. Staging flow — names in, IDs out

**Why names in staging:** The AI returns category names as strings. `StagingExpense.aiSuggestedCategory` stores the name verbatim. The staging UI uses `CategorySelect` with `valueBy="name"` so user corrections also store names.

**Resolution at confirm:** `confirmBatch` builds a `name → categoryId` map from `UserCategory` and resolves each row at import time. This is the only point where names become IDs.

**Edge case:** If the user renames a category between staging and confirm, the name won't resolve and the expense gets `categoryId: null` (Uncategorized). Acceptable.

---

### 10. Frontend — server data in TanStack Query, client state in Zustand

**Decision:** All server-fetched data lives in TanStack Query. Zustand is used only for pure client state that has no server counterpart.

| Zustand store | What it holds |
|---|---|
| `authStore` | `accessToken`, `user` |
| `themeStore` | `mode: "light" \| "dark"` |
| `filterStore` | Current expense filter state |
| `preferencesStore` | Currency preference |

**Why not Zustand for server data:** Putting server data in Zustand requires manual cache management, manual loading states, and manual invalidation. TanStack Query handles all three consistently. The component API is identical — only hook internals differ.

---

### 11. Budget Rebalancer — proportional cut distribution

**Feature:** When the user is over budget in one or more categories, the Dashboard shows a `BudgetRebalancer` card with actionable suggestions: how much less to spend in other budgeted categories to cover the shortfall.

**Algorithm (`BudgetRebalancer.tsx`):**

```
overspent   = rows where planned > 0 && diff < 0   (diff = planned − actual)
withSlack   = rows where planned > 0 && diff > 0
totalOverspend = sum(|diff|) for overspent rows
totalSlack     = sum(diff)   for slack rows
toDistribute   = min(totalOverspend, totalSlack)    // can't give what isn't there

For each slack category:
  cutBy = round(toDistribute × (categorySlack / totalSlack))
```

**Edge cases:**
- If no overspend → component returns null (invisible)
- If not the current month → returns null (past months can't be acted on)
- If `totalSlack < totalOverspend` → partial rebalance; footer shows remaining gap
- If `totalSlack === 0` → shows Alert: "No other budgeted categories have remaining room"

**Placement:** Rendered in `Dashboard.tsx` inside the Grid container, above the Income vs. Expenses overview. Only rendered when `comparison` data is available.

---

## API Routes (current)

All routes except `/auth/*` require `Authorization: Bearer <accessToken>`.

### Auth — `/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create account → `{ accessToken }` + httpOnly refresh cookie |
| POST | `/login` | Authenticate → same shape |
| POST | `/refresh` | Uses refresh cookie → new access token |
| POST | `/logout` | Clears refresh cookie |

### Expenses — `/expenses`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List (paginated, filterable by categoryId / date / source / search) |
| POST | `/` | Create |
| PATCH | `/:id` | Update |
| DELETE | `/:id` | Delete |

### CSV Upload — `/upload`

| Method | Path | Description |
|---|---|---|
| POST | `/csv` | Upload CSV + column mapping → `{ batchId, jobId, count }` |
| GET | `/jobs/:jobId/stream` | SSE stream of classification progress |
| GET | `/:batchId/staging` | List staging rows |
| PATCH | `/:batchId/staging/:id` | Correct category on a row |
| DELETE | `/:batchId/staging/:id` | Skip a row |
| POST | `/:batchId/confirm` | Promote staging rows to expenses |
| DELETE | `/:batchId` | Discard entire batch |

### Analytics — `/analytics`

| Method | Path | Description |
|---|---|---|
| GET | `/summary?month=YYYY-MM` | Monthly totals by category + budget overlap |
| GET | `/trends?months=6` | Last N months of summaries |
| GET | `/budget-comparison?month=YYYY-MM` | Planned vs actual per category |
| GET | `/income-breakdown?month=YYYY-MM` | Income by category |
| GET | `/insight?month=YYYY-MM` | AI-generated natural language insight |
| GET | `/recurring` | Recurring transactions |

### Budgets — `/budgets`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List all budgets |
| POST | `/` | Create |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Delete |
| POST | `/rollover` | Carry-forward recurring budgets into current month |

### Categories — `/categories`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List (auto-seeds 37 defaults on first call) |
| POST | `/` | Create `{ name, group? }` |
| PUT | `/:id` | Rename / re-group |
| DELETE | `/:id` | Soft-delete |
| PATCH | `/:id/restore` | Restore soft-deleted category |

### Natural Language Query — `/query`

| Method | Path | Description |
|---|---|---|
| POST | `/` | `{ input, mode: "ask" \| "add" }` — spending question or transaction parse |

### Cache — `/cache`

| Method | Path | Description |
|---|---|---|
| POST | `/flush` | Clear entire in-memory cache (dev use — after direct DB mutations) |

---

## Key component relationships

```text
AppShell
├── Sidebar / TopBar / BottomNav
└── <Outlet>
    ├── Dashboard       ← useAnalytics (summary, trends, comparison)
    ├── Expenses        ← useExpenses + FilterBar + ExpenseTable/CardList + DrillDownDrawer
    ├── Upload          ← useUpload
    │   ├── ColumnMapper          step 1: file + column mapping
    │   └── StagingReviewTable    step 2: review, correct, confirm
    ├── Analytics       ← useAnalytics (summary, trends, comparison, incomeBreakdown, insight)
    ├── Categories      ← useCategories + useBudgets + useAnalytics (spentMap)
    │   ├── [card view]   CategoryCard grid
    │   └── [table view]  CategoryCompactView
    └── Settings        ← themeStore, preferencesStore

QuickAddFAB → QuickAddSheet   ← useCategories (CategorySelect)
FilterBar                     ← useCategories (CategorySelect)
StagingReviewTable            ← useCategories (CategorySelect, valueBy="name")
DrillDownDrawer               ← useCategories (resolves name → id for filter)
```
