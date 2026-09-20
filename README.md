# Dimes

Track your dimes. Every one counts.

Dimes is a lightweight personal finance app built around a spreadsheet-style monthly workflow. Supabase handles authentication and Postgres data storage; the frontend focuses on the two core views that matter first: Monthly Summary and Ledger.

## Stack

- Frontend: React 19, MUI, Zustand, TanStack Query, Vite
- Backend: Node.js, Express, Supabase Auth verification
- Database: Supabase Postgres

## Setup

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Create a Supabase project, copy the values from Project Settings -> API, and run the SQL in `backend/supabase/migrations/001_initial_finance_schema.sql` in the Supabase SQL editor.

## Environment

`backend/.env`

```env
PORT=3000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

`frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Run

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## App Routes

- `/` - monthly summary
- `/ledger` - spreadsheet-style expense and income ledger
- `/login` and `/register` - Supabase auth

## API

- `GET /health`
- `GET /finance/summary?month=YYYY-MM`
- `GET /finance/transactions?month=YYYY-MM&type=expense`
- `POST /finance/transactions`
- `PATCH /finance/transactions/:id`
- `DELETE /finance/transactions/:id`
- `GET /finance/categories`
- `POST /finance/categories`
- `PATCH /finance/categories/:id`
- `DELETE /finance/categories/:id`
