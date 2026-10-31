# HomeAtlas operations guide

## Environment (Vercel)

Set all variables from `.env.example` in the Vercel project. Required in all environments:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `AUTH_SECRET` (≥32 random chars)
- `INTERNAL_WORKER_TOKEN` (shared secret for the cron worker)

Optional per provider: `RECONSTRUCTION_PROVIDER`/`RECONSTRUCTION_API_URL`/`RECONSTRUCTION_API_KEY`, `AI_LLM_PROVIDER`/`AI_VISION_PROVIDER`/`AI_EMBEDDING_PROVIDER`, `BILLING_PROVIDER`/`STRIPE_*`.

## Background worker

`vercel.json` schedules `GET /api/v1/internal/worker?limit=1` every 3 minutes. The route requires the `x-internal-token` header to match `INTERNAL_WORKER_TOKEN` (set it in Vercel Cron header). If a job stays `running` >15 min the worker requeues it.

## Database migrations

Schema lives in `supabase/migrations/`. Apply new migrations to the linked Supabase project; never edit an applied migration. `supabase/tests/rls_tests.sql` should be run after any RLS change.

## Storage buckets (private)

- `home-media` — scan uploads; path `{user_id}/scans/{scanId}/…`; insert/select/delete policies check `foldername(name)[1] = auth.uid()`.
- `documents` — receipts/manuals; `{user_id}/documents/{objectId}/…`.
- `exports` — reports; `{user_id}/reports/…`.

Never make these buckets public. All reads use short-lived signed URLs.

## Data retention & deletion

- Account deletion (`POST /api/v1/account/delete`) removes the Auth user; FK cascades remove profile + owned records. Storage purge is a separate retention job (recommended daily cron listing `storage.objects` for deleted users).
- Reports are stored per-user under `exports/{user_id}/…` and expire with the account.

## Monitoring

- Worker runs are logged via the API’s `withErrorHandling` (server console).
- Add uptime + error tracking (e.g. Sentry) before production launch; the codebase is instrumented with structured error responses ready for it.

## Deploy

Push to the linked Vercel project (production branch). Verify `deploy_status` reports READY and the entry page loads. Supabase is managed separately (SQL migrations + dashboard).

## Rollback

Migrations are forward-only; to roll back a schema change, add a corrective migration. Environment variables are managed in Vercel (redeploy after change).
