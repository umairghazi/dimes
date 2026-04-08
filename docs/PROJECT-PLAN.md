# Dimes App - Full Project Plan

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Component Library | MUI (Material UI) v6 + Emotion |
| Custom Styling | SCSS Modules + Emotion `styled()` |
| State Management | Zustand |
| Charts | Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB |
| ODM | Prisma (MongoDB connector) |
| Encryption | MongoDB CSFLE (Client-Side Field Level Encryption) |
| Auth | JWT (access + refresh tokens), bcrypt |
| AI | Provider-agnostic via Factory Pattern (Anthropic / OpenAI / Google / AWS Bedrock / Local) |
| Validation | Zod (controller layer) |

---

## Additional Features (Beyond Requirements)

- Recurring transaction detection - auto-flag subscriptions and bills
- Anomaly alerts - notify when spending spikes unusually in a category
- Net worth snapshot - track savings vs. spending over time
- Export reports - PDF/CSV of monthly summaries
- Split transactions - one transaction mapped to multiple categories
- Onboarding CSV column mapper - user maps their bank's CSV columns (date, amount, description) on first upload since every bank exports differently
- Goals - save $X by Y date, tracked alongside budgets
- One-off daily transaction entry - FAB quick-add + natural language entry (see Feature Flows)
- PWA support - add to homescreen on mobile for app-like experience

---

## System Architecture Overview

```text
Client (React + TypeScript + Vite)
        │  HTTPS/REST + JWT
        ▼
API Gateway (Node/Express)
        │
   ┌────┴──────────────────────┐
   │  Auth Service             │
   │  Upload Service           │
   │  Expense Service          │
   │  Budget Service           │
   │  Analytics Service        │
   │  AI Query Service         │
   └────┬──────────────────────┘
        │
   MongoDB (field-level encryption per user)
        │
   AI Provider (resolved at runtime from env)
   Anthropic | OpenAI | Google | AWS Bedrock | Ollama | LM Studio
```

---

## AI Provider Factory Pattern

### Design

All AI functionality routes through a single interface. The concrete provider is resolved at startup from environment variables - no code changes needed to switch models or providers, including local ones.

```text
IAIProvider (interface)
  → classify(transactions: RawTransaction[]): Promise<ClassifiedTransaction[]>
  → parseIntent(query: string, context: UserContext): Promise<StructuredQuery>
  → generateInsight(data: AnalyticsData): Promise<string>
```

### Provider Tree

```text
IAIProvider (interface)
  ├── AnthropicProvider       → Anthropic SDK
  ├── OpenAIProvider          → OpenAI SDK
  ├── GoogleProvider          → Google Generative AI SDK
  ├── AWSBedrockProvider      → AWS SDK, bedrock-runtime
  └── LocalProvider           → extends OpenAIProvider, overrides baseURL
                                compatible with Ollama, LM Studio,
                                or any OpenAI-compatible local server
```

`LocalProvider` is a thin extension of `OpenAIProvider` - Ollama and LM Studio both expose OpenAI-compatible APIs, so only `baseURL` and `apiKey` are swapped from env. Zero extra logic needed.

All prompt templates live in `src/ai/prompts/` - completely decoupled from provider implementations. The same prompts run regardless of which provider is active. Each provider normalizes its response back to the shared TypeScript types defined in `AITypes.ts`.

### Env-Driven Provider Selection

```bash
AI_PROVIDER=anthropic   # anthropic | openai | google | bedrock | local

# Anthropic
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-5

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o

# Google
GOOGLE_API_KEY=
GOOGLE_MODEL=gemini-1.5-pro

# AWS Bedrock
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL=anthropic.claude-3-5-sonnet

# Local (Ollama / LM Studio / any OpenAI-compatible)
LOCAL_AI_BASE_URL=http://localhost:11434/v1
LOCAL_AI_MODEL=llama3.2
LOCAL_AI_API_KEY=ollama
```

### AI Module Structure

```text
src/
  ai/
    interfaces/
      IAIProvider.ts
      AITypes.ts               ← RawTransaction, ClassifiedTransaction,
                                  StructuredQuery, AnalyticsData
    providers/
      AnthropicProvider.ts
      OpenAIProvider.ts
      GoogleProvider.ts
      AWSBedrockProvider.ts
      LocalProvider.ts         ← extends OpenAIProvider, swaps baseURL
    prompts/
      classification.prompt.ts
      intentParsing.prompt.ts
      insights.prompt.ts
    AIProviderFactory.ts       ← reads AI_PROVIDER env, returns IAIProvider
```

---

## Backend - Repository Pattern Architecture

### Layer Responsibilities

```text
routes/         → define endpoints, attach middleware
controllers/    → input validation (Zod), instantiate & inject services
services/       → business logic, dependency injection of repositories
repositories/   → data fetching layer (MongoDB via Prisma, or external HTTP APIs)
```

### Prisma as ODM

Prisma replaces Mongoose. All models defined once in `schema.prisma` - no duplicate schema + TypeScript interface files. `PrismaClient` is fully typed and auto-generated from the schema.

`BaseMongoRepository<T>` wraps the relevant Prisma delegate:

```text
constructor receives prisma delegate (e.g. prisma.expense)

getById     → prisma.expense.findUnique({ where: { id } })
getAll      → prisma.expense.findMany({ where: filters })
create      → prisma.expense.create({ data })
updateById  → prisma.expense.update({ where: { id }, data })
deleteById  → prisma.expense.delete({ where: { id } })
findOne     → prisma.expense.findFirst({ where })
findMany    → prisma.expense.findMany({ where })
exists      → prisma.expense.count({ where }) > 0
count       → prisma.expense.count({ where })
```

### Base Repository Classes

#### `BaseMongoRepository<T>` (abstract)

- Generic typed to the Prisma model delegate
- Constructor receives the Prisma delegate via `super(prisma.expense)`
- Throws normalized `RepositoryError` - services never handle raw Prisma errors

#### `BaseHttpRepository` (abstract)

- Wraps an axios instance
- Constructor receives `baseURL` and default headers
- Methods: `get`, `post`, `put`, `patch`, `delete`
- Handles base URL config, auth headers, timeout, error normalization, retry logic
- Throws normalized `HttpRepositoryError`

### Repository Inheritance Tree

```text
BaseMongoRepository<T>
  ├── UserRepository
  ├── ExpenseRepository
  │     └── findByUserId, findByDateRange, aggregateByCategory
  ├── StagingRepository
  │     └── findByBatchId, confirmBatch, deleteByBatchId
  └── BudgetRepository
        └── findByUserAndMonth, findAllByUser

BaseHttpRepository
  ├── ClassificationRepository   ← delegates to AIProviderFactory
  └── NLQueryRepository          ← delegates to AIProviderFactory
```

### Key Design Notes

- `ExpenseRepository.getAll` always scopes by `userId` - enforced at the repo layer, not just the service layer, preventing cross-user data leaks regardless of how services call it
- Services receive repositories via constructor injection - trivially swappable in tests
- Mock `BaseMongoRepository` once and all concrete repos inherit the mock behavior

---

## Backend - Project Structure

```text
backend/
  prisma/
    schema.prisma              ← single source of truth for all models

  src/
    config/
      db.ts                    ← Prisma client singleton
      encryption.ts            ← CSFLE key vault setup
      env.ts                   ← validated env vars (Zod)

    base/
      BaseMongoRepository.ts
      BaseHttpRepository.ts

    ai/
      interfaces/
        IAIProvider.ts
        AITypes.ts
      providers/
        AnthropicProvider.ts
        OpenAIProvider.ts
        GoogleProvider.ts
        AWSBedrockProvider.ts
        LocalProvider.ts
      prompts/
        classification.prompt.ts
        intentParsing.prompt.ts
        insights.prompt.ts
      AIProviderFactory.ts

    repositories/
      user.repository.ts
      expense.repository.ts
      staging.repository.ts
      budget.repository.ts
      classification.repository.ts   ← extends BaseHttpRepository
      nlQuery.repository.ts          ← extends BaseHttpRepository

    services/
      auth.service.ts
      expense.service.ts
      upload.service.ts
      classification.service.ts
      budget.service.ts
      analytics.service.ts
      nlQuery.service.ts

    controllers/
      auth.controller.ts
      expense.controller.ts
      upload.controller.ts
      budget.controller.ts
      analytics.controller.ts
      query.controller.ts

    routes/
      auth.routes.ts
      expense.routes.ts
      upload.routes.ts
      budget.routes.ts
      analytics.routes.ts
      query.routes.ts

    middleware/
      auth.middleware.ts        ← JWT verification, attach req.user
      error.middleware.ts       ← global error handler
      rateLimiter.middleware.ts

    errors/
      RepositoryError.ts
      HttpRepositoryError.ts
      AppError.ts

    types/
      express.d.ts              ← extend Request with user
      common.types.ts

    app.ts
    server.ts
```

---

## Data Models (Prisma Schema)

```prisma
model User {
  id                  String    @id @default(auto()) @map("_id") @db.ObjectId
  email               String    @unique
  passwordHash        String
  dataEncryptionKeyId String
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  preferences         Json
  expenses            Expense[]
  budgets             Budget[]
}

model Expense {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  userId              String   @db.ObjectId
  user                User     @relation(fields: [userId], references: [id])
  date                DateTime
  description         String             // encrypted
  amount              Float              // encrypted
  currency            String
  category            String
  subCategory         String?
  merchantName        String?            // encrypted
  source              String             // "manual" | "csv-upload"
  isRecurring         Boolean  @default(false)
  tags                String[]
  originalDescription String?            // raw CSV value, encrypted
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model StagingExpense {
  id                    String   @id @default(auto()) @map("_id") @db.ObjectId
  userId                String   @db.ObjectId
  uploadBatchId         String
  date                  DateTime
  description           String
  amount                Float
  aiSuggestedCategory   String
  aiConfidence          Float
  userCorrectedCategory String?
  status                String   @default("pending") // pending | confirmed | rejected
  createdAt             DateTime @default(now())
}

model Budget {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  userId          String   @db.ObjectId
  user            User     @relation(fields: [userId], references: [id])
  category        String
  monthYear       String   // e.g. "2025-03"
  limitAmount     Float
  currency        String
  alertThreshold  Float    @default(0.8)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### ExpenseCategory (shared enum - FE and BE)

```ts
"Food & Dining" | "Transport" | "Shopping" | "Entertainment" |
"Health" | "Utilities" | "Travel" | "Income" |
"Subscriptions" | "Personal Care" | "Education" | "Other"
```

---

## API Endpoints

| Method | Route | Description |
| --- | --- | --- |
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login → access + refresh tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate refresh token |
| POST | `/upload/csv` | Upload + parse CSV, run AI classification |
| GET | `/upload/:batchId/staging` | Get staging rows for review |
| PATCH | `/upload/:batchId/staging/:id` | Correct a category on a staging row |
| POST | `/upload/:batchId/confirm` | Confirm batch → move to expenses |
| DELETE | `/upload/:batchId` | Discard a staging batch |
| GET | `/expenses` | Paginated, filtered expenses (userId scoped) |
| GET | `/expenses/:id` | Single expense |
| POST | `/expenses` | Create a single manual expense |
| PATCH | `/expenses/:id` | Edit expense |
| DELETE | `/expenses/:id` | Delete expense |
| GET | `/budgets` | Get all budgets for user |
| POST | `/budgets` | Create budget |
| PATCH | `/budgets/:id` | Update budget |
| DELETE | `/budgets/:id` | Delete budget |
| GET | `/analytics/summary` | Monthly category summary |
| GET | `/analytics/trends` | Multi-month trend data |
| GET | `/analytics/recurring` | Detected recurring transactions |
| POST | `/query/nl` | Natural language query or NL add transaction |

---

## Feature Flows

### 1. CSV Upload & AI Classification

```text
1. User uploads CSV file
2. Column mapper UI → user maps: date col, amount col, description col
3. Backend parses rows, creates a staging batch (uploadBatchId)
4. ClassificationRepository sends batches of 20–50 rows to AIProviderFactory
   Prompt returns JSON: { category, subCategory, merchantName, isRecurring, confidence }
5. Rows stored in staging collection with aiSuggestedCategory + aiConfidence
6. Frontend shows review table:
   - High confidence rows (>0.85) pre-checked
   - Low confidence rows flagged for review
   - Inline category dropdown to correct any row
7. User hits "Confirm Import"
8. StagingRepository.confirmBatch() → moves rows to expenses collection
9. Staging batch deleted
```

### 2. One-Off Daily Transaction Entry

Two complementary entry paths - both hit `POST /expenses` with `source: "manual"`.

#### Path A - FAB Quick-Add (Primary, lowest friction)

A persistent floating `+` action button visible on every page at all times.

- Tapping opens a **bottom sheet on mobile / compact modal on desktop**
- Auto-focuses Amount field, triggers numeric keyboard on mobile
- Fields: Amount → Description → Date (defaults today) → Category
- As user types Description, AI suggests Category in real time (debounced 400ms)
- User rarely needs to manually select a Category
- ~10 seconds from tap to saved
- Confirmation snackbar with Undo for 5 seconds after save

```text
[ + FAB ] → Bottom Sheet / Modal
  ┌─────────────────────────┐
  │  $ 0.00    [numeric kb] │  ← auto-focused
  │  Description...         │
  │  📅 Today      🏷 Food  │  ← AI suggested category
  │  [ Cancel ]  [ Save ]   │
  └─────────────────────────┘
```

#### Path B - Natural Language Entry (Power Users)

The NL bar supports an Ask / Add mode toggle.

```text
User types: "spent $24 on lunch at chipotle today"
AI parses:  { amount: 24, description: "Chipotle", category: "Food & Dining", date: today }
Shows confirmation card with parsed fields → user taps Confirm or edits inline
```

Handles fuzzy input naturally: "grabbed coffee $6.50", "netflix 17.99 last friday", "paid $80 for gas yesterday"

### 3. Natural Language Query

```text
1. User types: "how much did I spend on eating out in March?"
2. NLQueryRepository → AIProviderFactory → parseIntent()
   Returns: { metric: "total_spend", category: "Food & Dining", period: "2025-03" }
3. nlQuery.service passes structured query to analytics.service
4. Returns: { answer: "$847", breakdown: [...], chartData: [...] }
5. UI renders answer card + supporting mini chart
```

### 4. Budget Progress

```text
1. Budget set: Food & Dining = $600/month
2. analytics.service aggregates current month spend for category
3. Returns: { spent: 430, limit: 600, percent: 71.6, daysRemaining: 11 }
4. UI renders progress bar: green <70% | amber 70–90% | red >90%
5. In-app alert triggered when threshold crossed
```

---

## Security

- **Auth:** JWT access tokens (15 min expiry) + refresh tokens (7 days), stored in `httpOnly` cookies
- **Passwords:** bcrypt, salt rounds 12
- **Field-level encryption:** MongoDB CSFLE - `amount`, `description`, `merchantName`, `originalDescription` encrypted per user using individual Data Encryption Keys (DEK) stored in a key vault collection
- **Transport:** HTTPS only, CORS restricted to frontend origin
- **Input validation:** Zod schemas at controller layer - nothing raw reaches services
- **Rate limiting:** `express-rate-limit` on `/upload` and `/query/nl` endpoints
- **User scoping:** `ExpenseRepository` base query always includes `userId` filter - enforced at the repo layer not just the service layer

---

## Frontend - Responsive & Mobile-First Design

### Breakpoints (MUI defaults)

```text
xs:  0px      → mobile portrait
sm:  600px    → mobile landscape / small tablet
md:  900px    → tablet
lg:  1200px   → desktop
xl:  1536px   → large desktop
```

### Responsive Layout Strategy

**Mobile (xs/sm):**

- Bottom navigation bar with 5 items: Dashboard, Expenses, Add, Budgets, Analytics
- The Add item in the center of the bottom nav IS the FAB - always prominent
- Sidebar hidden, accessible via hamburger as a full-height drawer
- Expense tables collapse to card-list view
- Charts stack vertically at full width
- Modals render as full-screen bottom sheets with rounded top corners
- Filters accessible via a bottom sheet drawer

**Tablet (md):**

- Sidebar as icon-only rail, expands on hover
- 2-column grid for dashboard cards
- Tables visible with horizontal scroll if needed

**Desktop (lg+):**

- Full sidebar at 240px fixed width
- 3–4 column dashboard grid
- Modals as centered dialogs
- Full data tables with all columns

### Key Responsive Component Patterns

- `ExpenseTable` → `<Table>` on md+, `<ExpenseCardList>` on xs/sm
- `Dashboard` → 1 col mobile, 2 col tablet, 3–4 col desktop using MUI `Grid`
- `FilterBar` → inline on desktop, bottom sheet drawer on mobile
- `QuickAddSheet` → bottom sheet (mobile) / dialog (desktop) from the same component using breakpoint check
- `NLQueryBar` → full width on mobile, max-width centered on desktop
- All charts use Recharts `<ResponsiveContainer>` with reduced height on mobile

---

## Frontend - Project Structure

```text
frontend/
  src/
    styles/
      theme/
        lightTheme.ts          ← MUI createTheme() light
        darkTheme.ts           ← MUI createTheme() dark
        tokens.ts              ← shared design tokens (colors, radii, shadows)
        typography.ts          ← font scale config
      global/
        reset.scss
        variables.scss         ← SCSS vars mirroring theme tokens
        mixins.scss            ← breakpoints, flex/grid helpers
        animations.scss        ← keyframe definitions

    components/
      ui/
        StyledCard.tsx         ← emotion styled(MUI Card) + theme shadows
        StyledBadge.tsx
        ConfidencePill.tsx     ← color-coded AI confidence indicator
        BottomSheet.tsx        ← MUI Drawer anchor=bottom, rounded top corners
      charts/
        SpendingDonut.tsx
        TrendLine.tsx
        BudgetProgressBar.tsx  ← emotion styled, green→amber→red
        CategoryBarChart.tsx
      upload/
        CsvUploader.tsx
        CsvUploader.module.scss
        ColumnMapper.tsx        ← step 1: map CSV columns
        StagingReviewTable.tsx  ← step 2: review + correct AI suggestions
      expenses/
        ExpenseTable.tsx        ← table on md+
        ExpenseCardList.tsx     ← card list on mobile
        ExpenseTable.module.scss
        FilterBar.tsx           ← inline desktop
        FilterDrawer.tsx        ← bottom sheet mobile
        EditCategoryModal.tsx
      quickAdd/
        QuickAddFAB.tsx         ← floating action button
        QuickAddSheet.tsx       ← bottom sheet (mobile) / dialog (desktop)
        QuickAddSheet.module.scss
      budgets/
        BudgetCard.tsx
        BudgetCard.module.scss
        BudgetForm.tsx
        ProgressRing.tsx
      query/
        NLQueryBar.tsx          ← Ask / Add mode toggle
        NLQueryBar.module.scss
        QueryResultCard.tsx
      layout/
        AppShell.tsx            ← switches between sidebar and bottom nav
        Sidebar.tsx             ← desktop
        BottomNav.tsx           ← mobile (includes center Add item)
        TopBar.tsx
        AppShell.module.scss

    pages/
      Dashboard/
        Dashboard.tsx
        Dashboard.module.scss
      Expenses/
        Expenses.tsx
        Expenses.module.scss
      Upload/
        Upload.tsx              ← 3-step wizard: map → review → confirm
        Upload.module.scss
      Budgets/
        Budgets.tsx
        Budgets.module.scss
      Analytics/
        Analytics.tsx
        Analytics.module.scss
      Settings/
        Settings.tsx

    store/
      authStore.ts              ← Zustand: user, tokens
      themeStore.ts             ← Zustand: light/dark, persisted to localStorage
      filterStore.ts            ← Zustand: active expense filters

    hooks/
      useExpenses.ts
      useBudgets.ts
      useAnalytics.ts
      useNLQuery.ts
      useUpload.ts
      useBreakpoint.ts          ← convenience wrapper around MUI useMediaQuery

    api/
      client.ts                 ← axios instance, interceptors, token refresh
      auth.api.ts
      expenses.api.ts
      upload.api.ts
      budgets.api.ts
      analytics.api.ts
      query.api.ts

    types/
      expense.types.ts
      budget.types.ts
      analytics.types.ts
      upload.types.ts

    router/
      AppRouter.tsx             ← React Router v6
      ProtectedRoute.tsx

    App.tsx
    main.tsx
```

---

## Styling Architecture

### MUI Theme (Emotion)

- `createTheme()` defined separately for light and dark
- Custom palette, border radii, shadows, and typography defined via `tokens.ts`
- Global overrides for `MuiCard`, `MuiButton`, `MuiTable`, `MuiBottomNavigation`
- Dark/light toggle via Zustand `themeStore`, persisted to `localStorage`

### SCSS Modules

- Page-level grid layouts and structural composition
- Responsive breakpoint mixins from `mixins.scss`
- Keyframe animations from `animations.scss`

### Emotion `styled()`

- MUI component extensions that need dynamic theme-aware props
- `BudgetProgressBar` - fill color driven by `percentUsed` prop via `theme.palette`
- `QuickAddSheet` - layout shifts between mobile and desktop via theme breakpoints inline

### Token Sync

- `tokens.ts` is the single source of truth
- `variables.scss` mirrors these values manually - update both together when changing a token

---

## Environment Variables

### Backend `.env`

```bash
PORT=3000
MONGO_URI="" # will be updated later
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
ENCRYPTION_MASTER_KEY=         # 96 hex chars for CSFLE
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# AI Provider
AI_PROVIDER=anthropic          # anthropic | openai | google | bedrock | local

ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-5

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o

GOOGLE_API_KEY=
GOOGLE_MODEL=gemini-1.5-pro

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL=anthropic.claude-3-5-sonnet

LOCAL_AI_BASE_URL=http://localhost:11434/v1
LOCAL_AI_MODEL=llama3.2
LOCAL_AI_API_KEY=ollama
```

### Frontend `.env`

```bash
VITE_API_BASE_URL=http://localhost:3000
```

---

## Build Phases

### Phase 1 - Foundation

- Monorepo setup, tsconfigs, package.jsons
- Prisma schema, MongoDB connection, CSFLE setup
- Base repositories (`BaseMongoRepository`, `BaseHttpRepository`)
- Auth flow: register, login, JWT middleware, refresh tokens
- Frontend: Vite + React + TS scaffold, MUI theme (light + dark), responsive AppShell - sidebar on desktop, bottom nav on mobile from day one, routing

### Phase 2 - AI Provider Factory

- `IAIProvider` interface and shared `AITypes.ts`
- All provider implementations (Anthropic, OpenAI, Google, Bedrock, Local)
- Shared prompt templates in `prompts/`
- `AIProviderFactory` env-driven resolution
- Smoke test: hit classification endpoint with each provider

### Phase 3 - Upload & Classification

- CSV parser on backend (multer + papaparse)
- Column mapper UI (step 1)
- `ClassificationRepository` → AIProviderFactory
- Staging model + `StagingRepository`
- Upload service orchestration
- Staging review table with inline category correction (step 2)
- Confirm batch → expenses (step 3)

### Phase 4 - One-Off Transaction Entry

- `POST /expenses` endpoint for manual entries
- `QuickAddFAB` + `QuickAddSheet` - bottom sheet on mobile, dialog on desktop
- Real-time AI category suggestion as user types description (debounced 400ms)
- NL Add mode on the query bar - parse natural language → pre-fill confirm card

### Phase 5 - Expenses & Dashboard

- `ExpenseRepository` filter + aggregation methods
- Expense service, controller, routes
- `ExpenseTable` (desktop) + `ExpenseCardList` (mobile)
- `FilterBar` (desktop) + `FilterDrawer` bottom sheet (mobile)
- Dashboard: monthly summary cards, spending donut, category bar chart

### Phase 6 - Budgets

- `BudgetRepository`, budget service, CRUD routes
- Budget management page
- Progress bars with color thresholds
- In-app alerts when threshold crossed

### Phase 7 - Analytics

- Multi-month trend charts
- Category drill-down views
- Recurring transaction detection
- Advanced filters (date range, category, merchant, amount range)

### Phase 8 - Natural Language Queries

- `NLQueryRepository` → AIProviderFactory intent extraction
- `nlQuery.service` → structured query → analytics service
- Ask / Add toggle on the NL query bar
- Query result cards with supporting mini charts

### Phase 9 - Polish & Extra Features

- Anomaly detection alerts
- PDF/CSV export
- Split transactions
- Goals tracking
- PWA config - manifest, service worker, add-to-homescreen
- Performance: Prisma query indexes, React Query caching, virtualized tables for large datasets

---

## Suggested Claude Code Prompting Order

Build in this sequence to avoid circular dependencies and keep each step independently testable:

1. **Scaffold structure** - monorepo folders, tsconfigs, package.jsons, Prisma schema
2. **Base repositories** - `BaseMongoRepository` and `BaseHttpRepository`
3. **AI Provider Factory** - `IAIProvider`, all providers, `AIProviderFactory`, prompt templates
4. **Auth backend** - UserRepository → AuthService → AuthController → routes + middleware
5. **MUI theme + responsive AppShell** - build sidebar (desktop) and bottom nav (mobile) from the start; all pages built inside this shell
6. **Upload pipeline** - most complex flow; tackle early while codebase is small
7. **Quick-add transaction** - FAB + bottom sheet/dialog + NL add mode
8. **Expenses CRUD** - straightforward once upload and manual entry work
9. **Dashboard + charts** - requires expense data to exist
10. **Budgets** - self-contained; build after dashboard
11. **Analytics** - builds on expense + budget data
12. **NL Query** - last AI feature; depends on analytics service being solid
13. **PWA + performance pass** - indexes, caching, virtualization, add-to-homescreen
