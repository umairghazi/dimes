# Deployment

## Required Services

- Supabase project for Auth and Postgres
- Node hosting for the Express backend
- Static hosting for the Vite frontend

## Backend Environment

```env
PORT=3000
NODE_ENV=production
CLIENT_ORIGIN=https://your-frontend-domain
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Frontend Environment

```env
VITE_API_BASE_URL=https://your-backend-domain
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Database

Run `backend/supabase/migrations/001_initial_finance_schema.sql` against the Supabase project before starting the backend.

Keep `SUPABASE_SERVICE_ROLE_KEY` on the backend only.
