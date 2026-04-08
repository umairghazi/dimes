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
