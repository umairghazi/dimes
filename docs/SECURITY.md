# Security Hardening Plan

## What's Already in Place

- `helmet` for HTTP security headers
- `bcrypt` with 12 salt rounds for password hashing
- Zod input validation on all routes
- JWT with httpOnly cookies + `sameSite: strict`
- Rate limiting on auth, upload, and NL query routes
- CORS locked to `CLIENT_ORIGIN` env var

---

## Critical Gaps (Prioritized)

### Priority 1 — Set AI provider spend caps (5 min)

Set hard monthly budget limits in the Anthropic and OpenAI dashboards. Last line of defense regardless of what the code does.

### Priority 2 — Rate limit `/analytics/insight` (5 min)

**File:** `backend/src/routes/analytics.routes.ts`

This route calls the AI provider with zero rate limiting. Apply `nlQueryRateLimiter` to it.

### Priority 3 — Rate limit `/auth/refresh` (2 min)

**File:** `backend/src/routes/auth.routes.ts`

The refresh token endpoint has no rate limiter. Apply `authRateLimiter`.

### Priority 4 — Switch rate limiters to user ID key (15 min)

**File:** `backend/src/middleware/rateLimiter.middleware.ts`

All rate limiters use IP by default — VPNs bypass them trivially. Add a custom key generator:

```ts
keyGenerator: (req) => (req as any).user?.id ?? req.ip
```

### Priority 5 — Add express-mongo-sanitize (10 min)

**File:** `backend/src/app.ts`

No NoSQL injection prevention installed. MongoDB queries built from user input can be exploited.

```bash
npm install express-mongo-sanitize
```

```ts
import mongoSanitize from 'express-mongo-sanitize'
app.use(mongoSanitize())
```

### Priority 6 — Per-user daily AI usage tracking (2-3 hours)

No per-user AI call tracking exists anywhere. A single user can trigger unlimited AI API calls.

**What to build:**

- Add `AIUsage` model to Prisma schema (userId, date, callType, count)
- Middleware that checks usage before AI calls and increments after
- Suggested daily limits per user:
  - NL queries: 20/day
  - CSV uploads: 3/day
  - Insight generation: 5/day

### Priority 7 — Fix JWT in query param for SSE endpoint (1-2 hours)

**File:** `backend/src/routes/upload.routes.ts` — `/upload/jobs/:jobId/stream`

JWT is passed as a query param to work around the EventSource API limitation. This means tokens appear in server access logs and browser history.

**Fix:** Generate a short-lived one-time UUID (valid ~30s), store in memory, exchange for stream access instead of passing the full JWT.

---

## AI Cost Protection — 3 Layers

1. **Hard spend caps** in AI provider dashboards (Anthropic console, OpenAI dashboard) — do this first
2. **Per-user rate limiting** by user ID (not IP) — prevents VPN bypass
3. **Per-user daily call limits** tracked in DB — hard cutoff per account
