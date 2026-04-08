# Dimes — Project Reference

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 7 |
| Component Library | MUI (Material UI) v9 + Emotion |
| Custom Styling | SCSS globals + Emotion `styled()` |
| State Management | Zustand 5 |
| Charts | Recharts 3 |
| Backend | Node.js, Express 5, TypeScript |
| Database | MongoDB Atlas |
| ODM | Prisma 6 (MongoDB connector) |
| Auth | JWT (access + refresh tokens), bcrypt |
| AI | Provider-agnostic via Factory Pattern (Anthropic / OpenAI / Google / AWS Bedrock / Local/Ollama) |
| Validation | Zod 4 (controller layer) |

---

## System Architecture

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
   │  NL Query Service         │
   │  Category Service         │
   └────┬──────────────────────┘
        │
   MongoDB Atlas
        │
   AI Provider (resolved at runtime from env)
   Anthropic | OpenAI | Google | AWS Bedrock | Ollama | LM Studio
```

---

## AI Provider Factory Pattern

All AI functionality routes through a single interface. The concrete provider is resolved at startup from `AI_PROVIDER` env var — no code changes needed to switch models or providers.

```text
IAIProvider (interface)
  ├── AnthropicProvider       → @anthropic-ai/sdk
  ├── OpenAIProvider          → openai SDK
  ├── GoogleProvider          → @google/generative-ai
  ├── AWSBedrockProvider      → @aws-sdk/client-bedrock-runtime
  └── LocalProvider           → extends OpenAIProvider, overrides baseURL
                                compatible with Ollama, LM Studio,
                                or any OpenAI-compatible local server
```

`IAIProvider` interface:

```ts
interface IAIProvider {
  classify(transactions: RawTransaction[], categories?: string[]): Promise<ClassifiedTransaction[]>
  parseIntent(query: string, context: UserContext): Promise<StructuredQuery>
  parseNLTransaction(input: string, context: UserContext): Promise<ParsedNLTransaction>
  generateInsight(data: AnalyticsData): Promise<string>
  suggestCategory(description: string): Promise<{ category: string; confidence: number }>
}
```

All prompt templates live in `src/ai/prompts/` — decoupled from provider implementations. Each provider normalizes its response back to the shared TypeScript types in `AITypes.ts`.

---

## Backend — Repository Pattern

### Layer responsibilities

```text
routes/         → define endpoints, attach middleware
controllers/    → input validation (Zod), call services
services/       → business logic, orchestrate repositories
repositories/   → data access (MongoDB via Prisma, or AI provider via Factory)
```

### Base classes

**`BaseMongoRepository<T>`** — wraps a Prisma delegate, provides `getById`, `getAll`, `create`, `updateById`, `deleteById`, `findOne`, `findMany`, `exists`, `count`. Throws normalized `RepositoryError` — services never handle raw Prisma errors.

**`BaseHttpRepository`** — wraps axios, provides `get`, `post`, `put`, `patch`, `delete`. Throws `HttpRepositoryError`.

### Repository tree

```text
BaseMongoRepository<T>
  ├── UserRepository
  ├── ExpenseRepository        ← findByDateRange, aggregateByCategory, filterExpenses
  ├── StagingRepository        ← findByBatchId, confirmBatch, deleteByBatchId
  ├── BudgetRepository         ← findByUserAndMonth, findAllByUser, findCarryForwardByMonth
  └── CategoryRepository       ← findByUserId, countByUserId

BaseHttpRepository
  ├── ClassificationRepository ← delegates to AIProviderFactory.classify()
  └── NLQueryRepository        ← delegates to AIProviderFactory.parseIntent/parseNLTransaction
```

### Key design decisions

- `ExpenseRepository` always scopes by `userId` at the repo layer — prevents cross-user leaks regardless of how services call it
- No denormalization — budget progress and category totals are aggregated on the fly
- Category stored on Expense is a plain string (no FK) — renaming/deleting a category doesn't invalidate historical expenses

---

## Backend — Project Structure

```text
backend/src/
  config/
    db.ts                    ← Prisma client singleton
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
    category.repository.ts
    classification.repository.ts
    nlQuery.repository.ts

  services/
    auth.service.ts
    expense.service.ts
    upload.service.ts
    budget.service.ts
    analytics.service.ts
    nlQuery.service.ts
    category.service.ts
    jobStore.ts              ← in-memory SSE job tracking for async upload

  controllers/
    auth.controller.ts
    expense.controller.ts
    upload.controller.ts
    budget.controller.ts
    analytics.controller.ts
    query.controller.ts
    category.controller.ts

  routes/
    auth.routes.ts
    expense.routes.ts
    upload.routes.ts
    budget.routes.ts
    analytics.routes.ts
    query.routes.ts
    category.routes.ts

  middleware/
    auth.middleware.ts        ← JWT verification, attaches req.user
    error.middleware.ts       ← global error handler
    rateLimiter.middleware.ts

  errors/
    AppError.ts
    RepositoryError.ts
    HttpRepositoryError.ts

  types/
    prisma.types.ts
    common.types.ts
    express.d.ts              ← extends Request with user

  app.ts
  server.ts
```

---

## Data Models

```prisma
model User {
  id                  String    @id @default(auto()) @map("_id") @db.ObjectId
  email               String    @unique
  passwordHash        String
  dataEncryptionKeyId String
  preferences         Json
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

model Expense {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  userId              String   @db.ObjectId
  date                DateTime
  description         String
  amount              Float
  currency            String
  category            String
  subCategory         String?
  merchantName        String?
  source              String             // "manual" | "csv-upload"
  isRecurring         Boolean  @default(false)
  tags                String[]
  originalDescription String?
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
  status                String   @default("pending")  // pending | confirmed | rejected
  createdAt             DateTime @default(now())
}

model Budget {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  userId         String   @db.ObjectId
  category       String
  monthYear      String                 // "YYYY-MM"
  limitAmount    Float
  currency       String
  alertThreshold Float    @default(0.8)
  carryForward   Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model UserCategory {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  name      String                 // full value: "Bill - Electricity"
  group     String?                // parent: "Bill", null for standalones
  sortOrder Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Frontend — Project Structure

```text
frontend/src/
  styles/
    theme/
      lightTheme.ts
      darkTheme.ts
      tokens.ts              ← shared design tokens (colors, radii, shadows)
      typography.ts
    global/
      reset.scss
      variables.scss
      mixins.scss
      animations.scss

  components/
    charts/
      SpendingDonut.tsx
      TrendLine.tsx
      BudgetProgressBar.tsx
      CategoryBarChart.tsx
      BudgetComparisonTable.tsx  ← planned vs actual per category with diff column
    upload/
      ColumnMapper.tsx           ← step 1: map CSV columns
      StagingReviewTable.tsx     ← step 2: review + correct AI suggestions
    expenses/
      ExpenseTable.tsx
      ExpenseCardList.tsx
      FilterBar.tsx
      CategoryEditCell.tsx
      ExpenseEditDialog.tsx
    quickAdd/
      QuickAddFAB.tsx
      QuickAddSheet.tsx
    query/
      NLQueryBar.tsx
      QueryResultCard.tsx
    layout/
      AppShell.tsx
      Sidebar.tsx
      BottomNav.tsx
      TopBar.tsx
    settings/
      CategoryManager.tsx        ← legacy list view (used internally)
      CategoryCompactView.tsx    ← new dense table view with collapsible groups
    shared/
      CategorySelect.tsx

  pages/
    Dashboard/Dashboard.tsx
    Expenses/Expenses.tsx
    Upload/Upload.tsx
    Categories/Categories.tsx    ← card view + compact view toggle
    Analytics/Analytics.tsx      ← month picker, charts, Budget vs Actual
    Settings/Settings.tsx
    Auth/Login.tsx
    Auth/Register.tsx

  store/
    authStore.ts
    themeStore.ts
    filterStore.ts
    preferencesStore.ts

  hooks/
    useExpenses.ts
    useBudgets.ts               ← optimistic updates (no loading flash on mutations)
    useAnalytics.ts             ← owns month state (prevMonth/nextMonth/isCurrentMonth)
    useNLQuery.ts
    useUpload.ts
    useCategories.ts
    useBreakpoint.ts

  api/
    client.ts                   ← axios instance, interceptors, 401 → token refresh
    auth.api.ts
    expenses.api.ts
    upload.api.ts
    budgets.api.ts
    analytics.api.ts
    categories.api.ts
    query.api.ts

  types/
    expense.types.ts
    budget.types.ts
    analytics.types.ts          ← includes BudgetComparison, BudgetComparisonRow
    upload.types.ts
    category.types.ts

  router/
    AppRouter.tsx
    ProtectedRoute.tsx

  App.tsx
  main.tsx
```

---

## Environment Variables

### Backend `backend/.env`

```bash
PORT=3000
MONGO_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
NODE_ENV=development
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

### Frontend `frontend/.env`

```bash
VITE_API_BASE_URL=http://localhost:3000
```

---

## Responsive Layout

**Mobile (xs/sm):** Bottom navigation bar, sidebar hidden, expense tables collapse to card-list view, charts stack vertically.

**Tablet (md):** Sidebar as icon-only rail.

**Desktop (lg+):** Full sidebar at 240px, full data tables.

Key responsive patterns:
- `ExpenseTable` → `<Table>` on md+, `<ExpenseCardList>` on xs/sm
- `QuickAddSheet` → bottom sheet (mobile) / dialog (desktop)
- All charts use Recharts `<ResponsiveContainer>`
