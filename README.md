# Dimes

Track your dimes. Every one counts.

A full-stack personal finance tracker with AI-powered categorization, budget tracking, and natural language queries.

## Stack

- **Frontend** - React 19, MUI v6, Zustand, Recharts, Vite (PWA)
- **Backend** - Node.js, Express, Prisma, MongoDB
- **AI** - Pluggable provider: Anthropic, OpenAI, Google, AWS Bedrock, or local (Ollama, LMStudio)

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)

### Setup

```bash
# Install all dependencies (workspaces hoisted to root)
npm install

# Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env - set MONGO_URI and at least one AI provider key
```

### Run

```bash
# Start both frontend and backend in parallel
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

---

## Architecture & code reference

### Repo layout

```
dimes/
├── frontend/src/
│   ├── api/              # Axios call modules (one per domain)
│   ├── components/
│   │   ├── shared/       # CategorySelect
│   │   ├── expenses/     # ExpenseTable, ExpenseCardList, FilterBar
│   │   ├── upload/       # ColumnMapper, StagingReviewTable
│   │   ├── budgets/      # BudgetCard, BudgetForm
│   │   ├── charts/       # SpendingDonut, TrendLine, CategoryBarChart, BudgetProgressBar
│   │   ├── quickAdd/     # QuickAddFAB, QuickAddSheet
│   │   ├── query/        # NLQueryBar, QueryResultCard
│   │   ├── layout/       # AppShell, Sidebar, TopBar, BottomNav
│   │   └── settings/     # CategoryManager
│   ├── hooks/            # useExpenses, useUpload, useCategories, useBudgets, useAnalytics, useNLQuery
│   ├── pages/            # Dashboard, Expenses, Upload, Budgets, Analytics, Settings, Auth
│   ├── store/            # Zustand stores: auth, theme, filter
│   ├── types/            # expense.types, budget.types, upload.types, category.types, analytics.types
│   └── router/           # AppRouter, ProtectedRoute
│
└── backend/src/
    ├── ai/
    │   ├── interfaces/   # IAIProvider, AITypes
    │   ├── providers/    # Anthropic, OpenAI, Local, Google, AWSBedrock
    │   ├── prompts/      # classification, intentParsing, insights
    │   └── AIProviderFactory.ts
    ├── controllers/      # auth, expense, upload, budget, analytics, query, category
    ├── routes/           # one file per controller
    ├── services/         # auth, expense, upload, budget, analytics, nlQuery, category
    ├── repositories/     # user, expense, staging, budget, classification, nlQuery, category
    ├── base/             # BaseMongoRepository, BaseHttpRepository
    ├── middleware/       # auth, error, rateLimiter
    ├── types/            # prisma.types, common.types, defaultCategories
    └── config/           # db, env
```

---

### Database models (Prisma / MongoDB)

#### User
```
id                  ObjectId
email               String (unique)
passwordHash        String
dataEncryptionKeyId String
preferences         Json
createdAt / updatedAt
```

#### Expense
```
id                  ObjectId
userId              ObjectId  → User
date                DateTime
description         String
amount              Float
currency            String
category            String    // matches a UserCategory.name for the user
subCategory         String?
merchantName        String?
source              String    // "manual" | "csv-upload"
isRecurring         Boolean
tags                String[]
originalDescription String?
createdAt / updatedAt
```

#### StagingExpense
Temporary holding area for CSV rows awaiting user review before being promoted to Expense.
```
id                    ObjectId
userId                ObjectId
uploadBatchId         String    // UUID grouping all rows from one upload
date                  DateTime
description           String
amount                Float
aiSuggestedCategory   String
aiConfidence          Float     // 0–1; 0 means AI unavailable
userCorrectedCategory String?
status                String    // "pending" | "confirmed" | "rejected"
createdAt
```

#### Budget
```
id             ObjectId
userId         ObjectId  → User
category       String    // matches a UserCategory.name
monthYear      String    // "YYYY-MM"
limitAmount    Float
currency       String
alertThreshold Float     // default 0.8 (80%)
createdAt / updatedAt
```

#### UserCategory
```
id        ObjectId
userId    ObjectId
name      String    // full stored value: "Bill - Electricity", "Groceries"
group     String?   // parent group name: "Bill", "Car", null for standalones
sortOrder Int       // display order within a group
createdAt / updatedAt
```

---

### API routes

All routes except `/auth/*` require `Authorization: Bearer <accessToken>`.

#### Auth - `/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create account → returns `{ accessToken }` + sets httpOnly refresh cookie |
| POST | `/login` | Authenticate → same response shape |
| POST | `/refresh` | Uses refresh cookie → issues new access token |
| POST | `/logout` | Clears refresh cookie |

#### Expenses - `/expenses`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List expenses (paginated, filterable by category / date / source) |
| POST | `/` | Create expense manually |
| PUT | `/:id` | Update expense |
| DELETE | `/:id` | Delete expense |

#### CSV Upload - `/upload`
| Method | Path | Description |
|---|---|---|
| POST | `/csv` | Upload CSV + column mapping → creates staging batch, returns `{ batchId, count, aiAvailable }` |
| GET | `/:batchId/staging` | List all staging rows for a batch |
| PATCH | `/:batchId/staging/:id` | Correct the AI category on a staging row |
| DELETE | `/:batchId/staging/:id` | Skip (remove) a single staging row |
| POST | `/:batchId/confirm` | Promote all remaining staging rows to real Expenses |
| DELETE | `/:batchId` | Discard the entire batch |

#### Budgets - `/budgets`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List budgets |
| POST | `/` | Create budget |
| PUT | `/:id` | Update budget |
| DELETE | `/:id` | Delete budget |

#### Analytics - `/analytics`
| Method | Path | Description |
|---|---|---|
| GET | `/summary?monthYear=YYYY-MM` | Monthly totals by category + budget overlap |
| GET | `/trends?months=6` | Last N months of summaries |
| GET | `/budget-progress?monthYear=YYYY-MM` | Per-budget spent / limit / percent |
| GET | `/recurring` | Recurring transactions |
| GET | `/insight?monthYear=YYYY-MM` | AI-generated natural language insight |

#### Natural Language Query - `/query`
| Method | Path | Description |
|---|---|---|
| POST | `/` | `{ input, mode: "ask"\|"add" }` - ask a spending question or parse a transaction |

#### Categories - `/categories`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List user's categories (auto-seeds 37 defaults on first call) |
| POST | `/` | Create category `{ name, group? }` |
| PUT | `/:id` | Rename or re-group `{ name?, group? }` |
| DELETE | `/:id` | Delete category |

---

### Authentication flow

1. `POST /auth/login` → server returns `{ accessToken }` in JSON body and sets an httpOnly `refreshToken` cookie.
2. Frontend stores `accessToken` in Zustand (`authStore`). Not persisted to localStorage - cleared on hard refresh by design.
3. Every API request attaches `Authorization: Bearer <accessToken>` via Axios request interceptor in `api/client.ts`.
4. On a 401 response, the Axios response interceptor automatically calls `POST /auth/refresh` (the browser sends the httpOnly cookie), receives a new access token, updates the store, and retries the original request transparently.
5. `ProtectedRoute` reads `authStore` - if no token, redirects to `/login`.

---

### CSV import flow

#### Step 1 - Column mapping (client-side only)

`ColumnMapper.tsx` parses the file immediately on selection using PapaParse with `header: false`, showing the first 5 rows.

- Each column gets a dropdown: **Date / Debit / Credit / Description / Ignore**
- Auto-detection runs on load: date-pattern values → Date, numeric values → Debit, long text → Description
- **"First row is a header"** toggle: auto-guessed (if all cells in row 0 are non-numeric), can be overridden. When on, row 0 shows as column labels and is excluded from data rows.
- Credit is optional. The "Upload & Review" button requires Date + Debit + Description.
- Submit sends column **indices** (not names), so it works for headerless CSVs.

Request body (`multipart/form-data`):
```
file              File
dateIndex         number
debitIndex        number
creditIndex       number   (-1 = not mapped)
descriptionIndex  number
hasHeader         "true"|"false"
```

#### Step 2 - Processing (backend)

`UploadService.processCSV`:
1. Parses the full CSV with `header: false`
2. Slices off row 0 if `hasHeader: true`
3. Extracts date / amount / description by column index
4. Strips currency symbols: `/[^0-9.]/g` applied to debit cell
5. **Filters out** rows where debit parsed as NaN or ≤ 0 - these are income/refund rows (empty debit cell in a Debit/Credit two-column CSV will produce NaN and get dropped automatically)
6. Fetches user's category list via `CategoryService.getCategoryNames(userId)`
7. Classifies transactions via `ClassificationRepository.classify(transactions, categoryNames)`
8. AI runs in batches of 50; if AI unavailable or a batch fails → category = `"Miscellaneous"`, confidence = `0`
9. Writes `StagingExpense` rows with `status: "pending"`
10. Returns `{ batchId, count, aiAvailable }`

#### Step 3 - Staging review (frontend)

`StagingReviewTable.tsx`:
- Row highlighted **amber** if `aiConfidence < 0.85` (low confidence)
- Row highlighted **red** if `aiConfidence === 0` (no AI, manual required)
- Category dropdown powered by `CategorySelect` → user's live category list
- **Skip** (trash icon) → `DELETE /upload/:batchId/staging/:id` - removes row from batch immediately
- **Confirm** button blocked until every remaining row has a non-default category
- **Discard** wipes the entire batch

#### Step 4 - Confirm

`POST /upload/:batchId/confirm` → for each staging row creates a real `Expense` using `userCorrectedCategory ?? aiSuggestedCategory`, then deletes all staging rows for the batch.

---

### Category system

#### How categories are stored

Each user has their own `UserCategory` rows. The `name` is the full value stored on `Expense.category` (e.g. `"Bill - Electricity"`). The `group` field is the visual parent (`"Bill"`) or `null` for standalones.

The category stored on an Expense is just a plain string - no foreign key. This means renaming or deleting a category doesn't invalidate existing expenses (they keep their original string), which is intentional.

#### Seeding

On the first `GET /categories` for a user, `CategoryService` checks the count. If zero, it bulk-creates all 37 defaults from `backend/src/types/defaultCategories.ts`. The client just sees a populated list - no special first-run logic needed anywhere.

#### Frontend tree

`useCategories` hook:
1. Fetches all categories from `GET /categories`
2. Groups them: named groups (Bill, Car, Giving, Home) get their children collected; standalones each become a solo entry
3. Named groups sorted alphabetically; standalones appended after
4. Exposes `categories[]`, `tree[]`, and `addCategory / updateCategory / deleteCategory` mutations that update both arrays optimistically

`CategorySelect` reads `tree` from `useCategories()` and renders:
- `ListSubheader` for each named group
- Indented `MenuItem` for children (label strips the group prefix: shows `"Electricity"` under `"Bill"`)
- Plain `MenuItem` for standalones

Because `useCategories` is called at the component level (not a singleton), every `CategorySelect` instance on the page shares the same React state through normal prop/hook mechanics. Mutations in `CategoryManager` reflect immediately in all open dropdowns on the same page.

#### Managing categories (Settings page)

`CategoryManager` component:
- Collapsible groups, showing child count
- Per-item **rename** (dialog, pre-filled) and **delete**
- **"Add subcategory"** button on group headers - opens Add dialog with group pre-filled
- Top-level **"Add category"** - group field blank by default (leave empty = standalone)

---

### AI provider system

`AIProviderFactory.ts` reads `AI_PROVIDER` from env and instantiates the right class. All five providers implement `IAIProvider`:

```ts
interface IAIProvider {
  classify(transactions: RawTransaction[], categories?: string[]): Promise<ClassifiedTransaction[]>
  parseIntent(query: string, context: UserContext): Promise<StructuredQuery>
  parseNLTransaction(input: string, context: UserContext): Promise<ParsedNLTransaction>
  generateInsight(data: AnalyticsData): Promise<string>
  suggestCategory(description: string): Promise<{ category: string; confidence: number }>
}
```

| Provider | Class | Notes |
|---|---|---|
| Anthropic | `AnthropicProvider` | `@anthropic-ai/sdk` |
| OpenAI | `OpenAIProvider` | `openai` SDK |
| Local (Ollama / LM Studio) | `LocalProvider extends OpenAIProvider` | Same as OpenAI, different `baseURL` + key |
| Google Gemini | `GoogleProvider` | `@google/generative-ai` |
| AWS Bedrock | `AWSBedrockProvider` | `@aws-sdk/client-bedrock-runtime` |

The `categories` parameter flows through the entire chain:
```
UploadService
  → CategoryService.getCategoryNames(userId)
  → ClassificationRepository.classify(transactions, categoryNames)
  → IAIProvider.classify(transactions, categoryNames)
  → buildClassificationPrompt(transactions, categoryNames)
```
The prompt lists exactly the user's defined categories so the AI only picks from those.

If no AI provider is configured, `isAIAvailable()` returns false. Classification skips AI entirely and returns every transaction as `"Miscellaneous"` with `confidence: 0`, forcing manual categorization in the staging review.

---

### Budget system

Budgets are per-category per-month (`monthYear: "YYYY-MM"`). Spend data is aggregated on the fly - no denormalization.

`BudgetProgress` computed in `AnalyticsService.getBudgetProgress`:
```
spent   = aggregated expense total for category in the month
percent = (spent / limitAmount) * 100
```

`alertThreshold` (default 0.8) is stored per budget. The frontend chart components use it to color-code progress bars.

---

### Natural language query

`POST /query` with `{ input, mode }`:

**`mode: "ask"`**
1. `NLQueryService` calls `parseIntent` - AI extracts `{ metric, category, period }` from free text (e.g. "how much did I spend on groceries last month")
2. Runs `AnalyticsService.getMonthlySummary` for the resolved period
3. Composes a human-readable answer string based on the metric type

**`mode: "add"`**
1. Calls `parseNLTransaction` - AI extracts `{ amount, description, category, date }` from natural language (e.g. "spent 40 bucks at Costco yesterday")
2. Returns `parsedTransaction` to the frontend - QuickAdd uses it to pre-fill the form

---

### Frontend state management

#### Zustand stores (survive navigation)
| Store | State |
|---|---|
| `authStore` | `accessToken`, `user`, `setAccessToken`, `clearAuth` |
| `themeStore` | `mode: "light"\|"dark"`, `toggleTheme` |
| `filterStore` | `filters: ExpenseFilters`, `setFilter`, `clearFilters` |

#### React hooks (page/component scoped)
| Hook | Owns |
|---|---|
| `useExpenses` | Paginated expense list, create/update/delete |
| `useUpload` | 3-step upload state machine (`map → review → done`), staging rows, skipRow, confirm, discard |
| `useCategories` | Category list + tree, add/update/delete mutations |
| `useBudgets` | Budget list, create/update/delete |
| `useAnalytics` | Monthly summary, trends, budget progress |
| `useNLQuery` | Query input, result, loading state |

---

### Key component relationships

```
AppShell
├── Sidebar / TopBar / BottomNav
└── <Outlet>
    ├── Dashboard       ← useAnalytics
    ├── Expenses        ← useExpenses + FilterBar + ExpenseTable / ExpenseCardList
    ├── Upload          ← useUpload
    │   ├── ColumnMapper          step 1: file selection + visual column mapping
    │   └── StagingReviewTable    step 2: review AI categories, skip rows, confirm
    ├── Budgets         ← useBudgets + BudgetCard + BudgetForm
    ├── Analytics       ← useAnalytics + SpendingDonut + TrendLine + CategoryBarChart
    └── Settings
        └── CategoryManager  ← useCategories

QuickAddFAB → QuickAddSheet   ← useCategories (CategorySelect)
FilterBar                     ← useCategories (CategorySelect)
StagingReviewTable            ← useCategories (CategorySelect)
BudgetForm                    ← useCategories (CategorySelect)
```

---

## Environment variables

### Backend (`backend/.env`)
```
MONGO_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLIENT_ORIGIN=http://localhost:5173

# Pick one AI provider:
AI_PROVIDER=anthropic          # anthropic | openai | local | google | bedrock

ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-6

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o

LOCAL_AI_BASE_URL=http://localhost:11434/v1
LOCAL_AI_MODEL=llama3
LOCAL_AI_API_KEY=ollama

GOOGLE_AI_API_KEY=
GOOGLE_AI_MODEL=gemini-1.5-pro

AWS_REGION=
AWS_BEDROCK_MODEL_ID=
```

### Frontend (`frontend/.env`)
```
VITE_API_BASE_URL=http://localhost:3000
```

---

## AI providers

Set `AI_PROVIDER` in `backend/.env` to one of:

| Value | Key required |
|---|---|
| `anthropic` | `ANTHROPIC_API_KEY` |
| `openai` | `OPENAI_API_KEY` |
| `google` | `GOOGLE_AI_API_KEY` |
| `bedrock` | AWS credentials in env |
| `local` | `LOCAL_AI_BASE_URL` (Ollama etc.) |

If no provider is configured, CSV import still works - transactions land as uncategorized and you assign categories manually in the staging review.
