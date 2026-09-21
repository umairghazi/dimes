# Security

## Current Model

- Supabase Auth owns identity and sessions.
- The frontend stores the Supabase browser session through the Supabase client.
- The backend accepts Supabase access tokens in `Authorization: Bearer ...`.
- The backend creates a request-scoped Supabase client with the authenticated user's access token.
- Supabase tables have row-level security policies scoped to `auth.uid()`.

## Secrets

The application does not require a Supabase service-role key. The frontend should only receive:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Data Access

The Express API filters all finance queries by the authenticated user id, and every database query runs with that user's JWT. RLS independently enforces the same ownership boundary.
