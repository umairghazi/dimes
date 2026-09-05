# Security

## Auth

Supabase Auth is the only app auth path on this branch. The frontend obtains a Supabase session and sends the Supabase access token as a bearer token to the backend.

The backend verifies the token with the Supabase service-role client before serving `/finance/*`.

## Google Sheets

The Google Sheet must remain private. Do not publish it publicly.

The backend accesses it through a Google service account:

1. Enable the Google Sheets API in Google Cloud.
2. Create a service account.
3. Share the spreadsheet with the service account email.
4. Store the service account private key only in backend environment variables.

## Secrets

Required backend secrets:

```text
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_SHEETS_PRIVATE_KEY
```

Never expose those values to the frontend. The frontend only receives the Supabase anon key.

## Current Limitations

- Sheet access is environment-scoped, not per-user yet.
- The ledger is read-only until Google Sheets write-back is implemented.
- There is no server-side cache yet, so every finance request may read the sheet directly.
