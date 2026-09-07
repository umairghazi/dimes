# Security

## Current Model

- Supabase Auth owns identity and sessions.
- The frontend stores the Supabase browser session through the Supabase client.
- The backend accepts Supabase access tokens in `Authorization: Bearer ...`.
- The backend uses the Supabase service-role key only on the server.
- Supabase tables have row-level security policies scoped to `auth.uid()`.

## Secrets

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend. The frontend should only receive:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Data Access

The Express API filters all finance queries by the authenticated user id. RLS adds a second layer of protection for direct Supabase access.
