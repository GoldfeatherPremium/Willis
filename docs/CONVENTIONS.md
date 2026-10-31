# HomeAtlas engineering conventions

## Stack
- Next.js 15 **App Router**, React 19, TypeScript (strict), Tailwind CSS v3.
- Supabase (auth, Postgres, storage, RLS, pgvector). Motion (free) for animation.
- Three.js + React Three Fiber for 3D.

## Structure
```
src/
  app/               # routes (App Router)
  components/
    ui/              # accessible primitives (button, input, dialog, ...)
    shell/           # authenticated app shell (sidebar/topbar)
    three/           # 3D/R3F components
  lib/               # non-component logic (clients, providers, services, config)
  server/            # (optional) server helpers
docs/                # API + ops docs
supabase/migrations/ # SQL migrations
tests/               # vitest unit tests
e2e/                 # playwright (optional)
```

## Imports
- Path alias: `@/` → `src/`. Always use `@/...` imports (no relative `../../`).
- Utility `cn()` from `@/lib/utils`.

## Design system (`src/app/globals.css` + `tailwind.config.ts`)
- Colors as CSS vars: `bg`, `bg-secondary`, `surface`, `surface-hover`, `primary`, `secondary`, `accent`, `warm`, `success`, `error`.
- Cards: `card` class; buttons: `btn-primary` / `btn-secondary` / `btn-ghost`; inputs: `input-base`; glass: `glass`.
- Type: headings `font-display` (Manrope), body default Inter. Tabular numbers: `tnum`.

## Components
- UI primitives live in `src/components/ui/`. Export kebab-case filenames with
  PascalCase component names. Accept `className` via `cn()`.
- Interactive elements must be keyboard-accessible; visible focus ring.
- Loading states: skeletons (`shimmer` class) or spinners; error states with retry; empty states with a clear action.
- Every route needs loading/error/empty/success states.

## Motion (free)
- `import { motion, AnimatePresence, useInView } from "motion/react"`.
- Spring transitions for UI; scroll-driven for storytelling (`useScroll`/`useTransform`).
- Respect `prefers-reduced-motion` (CSS in globals handles this; also gate JS animations with `useReducedMotion`).
- Avoid perpetual decoration animations.

## Server/client boundary
- Server Components by default; `"use client"` only when interactivity/state needed.
- All data fetching behind RLS (Supabase client). Never disable RLS. Admin client (service role) only in server code.
- Private data (home photos, receipts) lives in private storage buckets; URLs are signed, short-lived, never public.

## Validation & authorization
- Zod for every API/server-action input.
- Every API route: `withErrorHandling` + `requireApiUser` / `requireApiHomeAccess`.
- Quotas enforced server-side via `evaluateUsage` (`src/lib/config/plans.ts`).

## Providers (replaceable)
- `src/lib/ai/`, `src/lib/reconstruction/`, `src/lib/payments/` expose interfaces
  + factories (`getXProvider()`) reading env. Simulated adapters are clearly
  labelled (is_simulated / label "Simulated"). Real adapters are inert without
  credentials. Never fake real results.

## Testing
- `npm run typecheck`, `npm run lint`, `npm test` (vitest), `npm run e2e`.
- Unit-test pure logic (validation, plans, providers, formatting). DB/RLS checks
  live in `supabase/tests/rls_tests.sql` (run via psql or Supabase SQL editor).
