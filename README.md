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

- Frontend: [http://localhost:5173]
- Backend: [http://localhost:3000]

## Features

- **CSV import** - upload bank exports, map columns, review and categorize transactions
- **AI categorization** - automatic expense classification with per-row confidence scores
- **Manual fallback** - full import flow works without any AI configured
- **Budgets** - set monthly limits per category with progress tracking
- **Analytics** - spending breakdowns and trends via charts
- **NL queries** - ask questions about your spending in plain English
- **Dark mode** - full light/dark theme
- **PWA** - installable, works offline

## AI providers

Set `AI_PROVIDER` in `backend/.env` to one of:

| Value | Key required |
| ------- | ------------- |
| `anthropic` | `ANTHROPIC_API_KEY` |
| `openai` | `OPENAI_API_KEY` |
| `google` | `GOOGLE_API_KEY` |
| `bedrock` | AWS credentials in env |
| `local` | `LOCAL_AI_BASE_URL` (Ollama etc.) |

If no provider is configured, CSV import still works - transactions land as uncategorized and you assign categories manually.

## Project structure

```text
dimes-app/
├── backend/          # Express API, Prisma, services, AI providers
├── frontend/         # React app, MUI theme, pages, components
└── package.json      # npm workspaces root
```
