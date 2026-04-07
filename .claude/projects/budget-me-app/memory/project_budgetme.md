---
name: budget-me-app project context
description: Full-stack expense/budget tracker — tech stack, build status, and setup instructions
type: project
---

Full-stack expense & budget tracker with React + MUI frontend and Node/Express + Prisma + MongoDB backend.

**Phase status:** Phase 1 (Foundation) + Phase 2 (AI Factory) + Phase 3 (Upload) + Phase 4 (Quick-Add) + Phase 5 (Expenses/Dashboard) + Phase 6 (Budgets) + Phase 7 partial (Analytics charts) + Phase 8 (NL Query) — all scaffolded and type-checking clean.

**Why:** Built from the plan in `expense-tracker-plan.md`.

**How to apply:** When continuing this project, all major files exist. Next steps are:
1. Add MONGO_URI to `backend/.env` (copy from `.env.example`)
2. Run `cd backend && npm run prisma:generate && npm run prisma:push`
3. Copy `backend/.env.example` → `backend/.env` and fill secrets
4. Copy `frontend/.env.example` → `frontend/.env`
5. `npm run dev` from root to start both servers

**Key architecture decisions:**
- Prisma types in `backend/src/types/prisma.types.ts` (local, until `prisma generate` runs against live DB)
- All `@types/*` hoisted to root `package.json` devDependencies (avoids duplicate `express-serve-static-core`)
- AI provider factory in `backend/src/ai/AIProviderFactory.ts` — set `AI_PROVIDER` env var
- `ExpenseRepository` always scopes by `userId` at repo layer (not just service layer)
- `LocalProvider` extends `OpenAIProvider` — works with Ollama/LM Studio out of the box
