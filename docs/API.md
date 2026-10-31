# HomeAtlas API v1

All endpoints live under `/api/v1`. They return JSON `{ "data": ... }` on
success or `{ "error": { "code", "message" } }` on failure.

All routes are protected by server-side auth (Supabase session cookie). Use the
helpers in `src/lib/api-helpers.ts` (`withErrorHandling`, `parseBody`,
`requireApiUser`, `requireApiHomeAccess`, `rateLimit`). Use Zod schemas for
every input. `crypto.randomUUID()` for ids. API errors are `ApiError`.

## Auth & session

Supabase email/password + Google OAuth. Session lives in cookies via
`@supabase/ssr`. Public routes: `/login`, `/signup`, `/auth/callback`,
`/forgot-password`, `/reset-password`, `/verify`.

## Homes

| Method | Path | Body / Notes |
|---|---|---|
| POST | `/api/v1/homes` | `{ name, homeType?, address? }` → home. Enforces plan quotas (`evaluateUsage`) + creates owner home_member row + activity event. |
| GET | `/api/v1/homes` | List homes for current user (via `user_homes` view). |
| PATCH | `/api/v1/homes/:id` | `{ name?, homeType?, address? }`. Owner/admin only. |
| DELETE | `/api/v1/homes/:id` | Owner only. Soft-deletes (archived_at) + files remain until purge. |

## Rooms

| Method | Path | Body / Notes |
|---|---|---|
| POST | `/api/v1/rooms` | `{ homeId, name, roomType?, floor?, width?, length?, height?, position? }`. Enforces room quota per home. |
| GET | `/api/v1/rooms?homeId=` | Rooms for a home. |
| PATCH | `/api/v1/rooms/:id` | Update name/type/dimensions/position. |

## Scans & processing

| Method | Path | Body / Notes |
|---|---|---|
| POST | `/api/v1/scans` | `{ roomId, captureType? }` → creates scan (status `pending`) + reconstruction job row. Enforces capture quota. |
| POST | `/api/v1/scans/:id/upload-url` | `{ filename, kind: "image"\|"video" }` → `{ uploadUrl, storagePath, headers }`. Signed upload URL (Supabase Storage private bucket); 5 min expiry; one file per request. |
| POST | `/api/v1/scans/:id/complete` | Marks uploads finished → status `validated`; starts processing (queues job). |
| POST | `/api/v1/scans/:id/process` | Starts/retries processing. Idempotent (ignore if already processing/completed). |
| GET | `/api/v1/jobs/:id` | Job status: `{ id, status, progress, error, result? }`. |
| GET | `/api/v1/jobs?scanId=` | List jobs for a scan. |
| GET | `/api/v1/internal/worker` | Internal cron worker (see below). |

Processing: `reconstruction_jobs` rows are processed by the local worker. The
worker is triggered by Vercel Cron (`vercel.json`) hitting
`GET /api/v1/internal/worker` with header `x-internal-token` matching
`INTERNAL_WORKER_TOKEN`. It runs `src/lib/jobs/worker.ts` -> `runPendingJobs()`,
which drains queued jobs via the configured reconstruction provider and updates
scans/jobs. The simulated provider completes instantly; real providers poll.

## Objects & inventory

| Method | Path | Body / Notes |
|---|---|---|
| GET | `/api/v1/objects?homeId=&roomId=&q=&category=` | List/search (q => name/description ILIKE). |
| POST | `/api/v1/objects` | Create manually: `{ homeId, roomId?, name, category? }`. |
| GET | `/api/v1/objects/:id` | Full object + current location (`object_locations` where is_current) + latest observation. |
| PATCH | `/api/v1/objects/:id` | Update name/category/description/brand/model/serial_number/condition/room_id/notes. Writes a corrected observation + updates current location when room_id changes. |
| DELETE | `/api/v1/objects/:id` | Soft delete (archived_at). |

## AI

| Method | Path | Body / Notes |
|---|---|---|
| POST | `/api/v1/search` | `{ homeId, query }` → semantic + keyword search over objects in home. |
| POST | `/api/v1/assistant/chat` | `{ conversationId?, homeId, message }` → `{ reply, conversationId, toolCalls? }`. The LLM uses backend tools (see `src/lib/ai/tools.ts`). Simulated provider returns rule-based answers from real DB data only. |

## History, reports, documents

| Method | Path | Body / Notes |
|---|---|---|
| GET | `/api/v1/history?homeId=&objectId=` | Activity events (+ per-object location history). |
| POST | `/api/v1/reports/insurance` | `{ homeId }` → generates insurance inventory report (PDF via server-side render or CSV). Stores in storage, returns URL. |
| POST | `/api/v1/documents` | `{ objectId, kind? }` + multipart/signed upload → stores file in private bucket, row in `object_documents`. |

## Billing

| Method | Path | Body / Notes |
|---|---|---|
| POST | `/api/v1/billing/checkout` | `{ planId }` → `{ url }` (Stripe Checkout or simulated). |
| POST | `/api/v1/billing/portal` | → `{ url }` billing portal. |
| POST | `/api/v1/billing/webhook` | Stripe webhook (signature verified; simulated provider calls `/api/v1/billing/simulate` in dev). |
| POST | `/api/v1/billing/simulate` | Dev-only: simulate webhook events (`plan_changed`, `payment_failed`, `subscription_canceled`). |
| GET | `/api/v1/billing/usage` | Current plan + month usage. |

## Demo (non-production only)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/demo/setup` | Requires `DEMO_MODE=true`. Creates a clearly-labelled demo home (`is_demo=true`) with rooms, objects, observations and a conversation. Gated by env; returns `{ homeId }`. |

## Idempotency & errors

- POSTs accept optional `Idempotency-Key` header; repeated keys return the first result.
- Error codes: `unauthenticated`, `forbidden`, `not_found`, `validation_error`, `invalid_json`, `rate_limited`, `quota_exceeded`, `conflict`, `provider_error`, `internal`.
