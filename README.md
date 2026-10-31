# HomeAtlas

**AI-powered 3D home reconstruction & spatial memory SaaS** — *Your world, reconstructed. Your belongings, remembered.*

HomeAtlas turns photographs/videos of a home into interactive 3D room views and an intelligent, searchable household inventory with persistent location memory. Built by **ReconstructAI** as a production-oriented consumer product.

This repository is the **application** (Next.js + Supabase). The marketing site is built separately in Framer (see “Marketing site” below).

---

## What’s included

| Area | Status |
|---|---|
| Next.js 15 app (App Router, React 19, TypeScript strict, Tailwind) | ✅ implemented |
| Supabase schema, RLS, storage, pgvector (single migration) | ✅ implemented |
| Authentication: email/password + verification, Google OAuth, password recovery | ✅ implemented |
| Homes / rooms / scans / inventory / history / documents / family / settings / billing UI | ✅ implemented |
| Capture uploads (signed URLs, private bucket) + background processing worker | ✅ implemented |
| Reconstruction provider abstraction (interface + clearly-labelled simulated adapter) | ✅ implemented (simulated) |
| AI provider abstraction (LLM / vision / embeddings) with simulated dev adapters | ✅ implemented (simulated) |
| Assistant with backend tools (searchObjects, getObject, history, rooms, docs, compareScans) | ✅ implemented |
| Semantic search (pgvector + provider-agnostic embeddings) | ✅ implemented |
| Interactive 3D room viewer (React Three Fiber) + 2D fallback | ✅ implemented (procedural scene) |
| Subscription plans + quotas enforced on the backend (Stripe adapter + simulated billing) | ✅ implemented (simulated billing) |
| Unit tests (vitest), RLS isolation test script | ✅ implemented |
| Vercel cron worker, docs, env template | ✅ implemented |

**Simulated vs real:** all providers default to clearly-labelled development adapters. The product is fully usable end-to-end without external keys; connecting real providers is a configuration change (see below). The UI always marks simulated data (scans, scenes, assistant, billing).

---

## Stack

- **App:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v3, Motion (free), Three.js + React Three Fiber
- **Auth / DB / storage:** Supabase (Auth, Postgres, Storage, RLS, pgvector)
- **Processing:** local worker drained by Vercel Cron (`vercel.json`) — swappable for Trigger.dev / Inngest
- **Payments:** adapter over Stripe (or simulated)
- **Hosting:** Vercel (app), Supabase (data), Framer (marketing)

## Repository layout

```
src/
  app/                      # routes: public pages, (auth), app shell, /api/v1/*
  components/
    ui/                     # accessible primitives (button, input, dialog, feedback, …)
    shell/                  # authenticated app shell + home switcher
    three/                  # R3F room scene + viewer wrapper
    auth/ room/ object/ assistant/ billing/ family/ reports/ settings/ home/
  lib/
    supabase/               # server/browser/middleware clients
    ai/                     # provider interface + simulated adapters + assistant orchestration
    reconstruction/         # provider interface + validation + simulated adapter
    payments/               # billing provider interface + Stripe/simulated adapters
    jobs/worker.ts          # background worker (drains reconstruction jobs + object detection)
    server/quota.ts         # plan/usage enforcement (backend authority)
    config/plans.ts         # plan definitions (source of truth)
    types/database.ts       # mirror of the SQL schema
supabase/
  migrations/               # schema + RLS + storage (source of truth is SQL)
  tests/rls_tests.sql       # cross-user isolation checks
tests/                      # vitest unit tests
docs/                       # API + conventions + ops
```

## Quick start

```bash
# 1. Install
npm install

# 2. Configure Supabase (create a project, run the migration, copy env)
cp .env.example .env.local
#   fill NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
#   and SUPABASE_SERVICE_ROLE_KEY (server only)

# 3. Generate a secret for auth cookies
#   AUTH_SECRET=$(openssl rand -base64 32)

# 4. Run the schema (SQL in supabase/migrations/20261031130000_homeatlas_init.sql)
#    - via Supabase SQL editor, or
#    - supabase db push (if you use the CLI)

# 5. Run
npm run dev            # http://localhost:3000
```

Demo mode (dev only):

```bash
DEMO_MODE=true npm run dev
# then click "Load a sample home" on the dashboard to create a clearly-labelled demo home.
```

## Checks

```bash
npm run typecheck
npm run lint
npm test               # vitest (28 tests)
npm run build          # production build
```

RLS isolation checks: open `supabase/tests/rls_tests.sql` in the Supabase SQL editor and follow the instructions.

## Providers (replaceable)

All providers use the same interface + factory pattern; simulated adapters are labelled and never return fake success.

| Provider | Interface | Simulated adapter | Real adapter |
|---|---|---|---|
| Reconstruction | `src/lib/reconstruction/provider.ts` | `simulated.ts` | wire COLMAP/nerfstudio/cloud under `RECONSTRUCTION_PROVIDER` |
| LLM | `src/lib/ai/provider.ts` | `simulated.ts` | OpenAI/Anthropic (stub throws when selected without adapter) |
| Vision | `src/lib/ai/provider.ts` | `simulated.ts` | OpenAI/Anthropic vision |
| Embeddings | `src/lib/ai/provider.ts` | `simulated.ts` | OpenAI embeddings + pgvector |
| Billing | `src/lib/payments/types.ts` | `simulated.ts` | Stripe (`BILLING_PROVIDER=stripe`) |

Connect real providers by setting the env vars in `.env.example` (e.g. `RECONSTRUCTION_PROVIDER=colmap`, `RECONSTRUCTION_API_URL=...`, `STRIPE_SECRET_KEY=...`). The app enforces quotas and authorization regardless of which adapter is active.

## Billing

Plans are defined in `src/lib/config/plans.ts`. Quotas are enforced server-side (`src/lib/server/quota.ts`) — browser values are never trusted. Stripe checkout/portal/webhooks are implemented and signature-verified; the default simulated adapter routes checkout to an in-app dev endpoint (`/api/v1/billing/simulate`), which is disabled in production.

## Background processing

`reconstruction_jobs` are drained by `src/lib/jobs/worker.ts` via **Vercel Cron** (`vercel.json`, every 3 min) hitting `/api/v1/internal/worker` with the `x-internal-token` header matching `INTERNAL_WORKER_TOKEN`. The worker validates captures, runs the configured reconstruction provider, then runs AI detection to create candidate objects (unverified) with observations + current locations. The simulated provider completes quickly; real providers are polled across ticks.

## Environment variables

See `.env.example` for every variable with documentation. Required for the app to run: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`, `INTERNAL_WORKER_TOKEN`. Never commit secrets.

## Marketing site

The marketing website (homeatlas.com) is built in **Framer** using the Framer MCP (this repo does not contain it). The Next.js app is the product application at app.homeatlas.com. All CTAs on the marketing site point to the app’s `/signup` and `/app` routes.

## Status report

**Fully implemented:** schema + RLS + storage + pgvector; auth flows; homes/rooms/scans/inventory/history/documents/family/settings/billing; signed uploads; background worker; provider abstractions; spatial memory model; assistant with real-data tools; semantic search; 3D viewer + 2D fallback; plan quotas; reports; demo mode; unit tests; build/typecheck/lint green.
**Require external credentials:** real reconstruction provider, real LLM/vision/embeddings, Stripe live keys, Google OAuth client IDs.
**Use development adapters (clearly labelled):** reconstruction, AI (LLM/vision/embeddings), billing.
**Not yet implemented:** native mobile app (Expo; planned as separate milestone), real gaussian-splat/mesh asset pipeline, custom 3D model library, PWA manifest (mobile-friendly responsive web included).
**Known limitations:** simulated AI/vision returns library-based suggestions (labelled); Stripe adapters are untested against a live account; cloud background queues (Trigger.dev/Inngest) are stubbed in favour of the local worker; rate limiting is in-memory (fine for single-instance dev).
