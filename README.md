# Cram Cloud

A full-stack student notes sharing and discussion platform, built as a
single Next.js (App Router) application — one codebase, one Vercel
deployment.

## Features

- Email/password authentication (JWT in an httpOnly cookie, verified server-side, never exposed to client JS)
- Role-based access control (student / admin)
- Semester-scoped PDF notes repository, with per-note comments
- Community discussion forum (threads + replies)
- Admin panel (upload/delete notes, manage users), with an audit log of admin actions

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript
- Prisma 7 (`@prisma/adapter-pg`) against Supabase Postgres
- Supabase Storage for PDF files (private bucket, access gated by the app)
- `jose` for session JWTs, `bcryptjs` for password hashing, `zod` for validation
- Tailwind v4 + shadcn/ui

Data access follows one pattern throughout: reads are plain async functions
in `lib/data/*.ts` called directly from Server Components; writes are
Server Actions in `lib/actions/*.ts`. Route Handlers are the exception,
used only where a Server Action doesn't fit: `app/api/pdf/[id]/file/route.ts`
streams PDF bytes back from Supabase Storage, and
`app/api/cron/prune-rate-limits/route.ts` is a Vercel Cron target —
everything else is Server Components and Server Actions. `lib/auth/dal.ts`
is the real authorization boundary (re-reads the user from the DB on every
request); `proxy.ts` (Next 16's rename of `middleware.ts`) only does an
optimistic redirect to avoid a flash of protected content.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, DIRECT_URL, JWT_SECRET, SUPABASE_*
npx prisma migrate dev       # creates the tables in Supabase, if not already applied
npm run dev
```

Requires a Supabase project (Postgres + Storage). `DATABASE_URL` is the
transaction-mode pooler (port 6543, `pgbouncer=true`) used at runtime;
`DIRECT_URL` is the session-mode pooler (port 5432) used only for
migrations. Both come from the Supabase project's Connect dialog.
`SUPABASE_SERVICE_ROLE_KEY` is the secret key (Project Settings → API
Keys) — server-side only, never exposed to the client.

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled Postgres connection (runtime) |
| `DIRECT_URL` | Direct Postgres connection (migrations only) |
| `JWT_SECRET` | Signs/verifies the session cookie |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase Storage access |
| `SUPABASE_STORAGE_BUCKET` | Bucket PDFs are stored in (private) |
| `CRON_SECRET` | Authenticates Vercel Cron's requests to `/api/cron/prune-rate-limits` |

`.env.local` is gitignored and must never be committed. `JWT_SECRET` must
be a long random value in any deployed environment — the app throws on
startup if it's missing.

## Testing

```bash
npm test
```

Vitest. Currently covers the highest-risk logic rather than everything:
`parseId` boundary handling, ownership checks on forum reply/thread
edit/delete, the Postgres rate limiter's concurrency and fail-closed
behavior, and login's timing-safe dummy-hash comparison. `server-only` is
stubbed globally in `vitest.setup.ts` (it throws outside a react-server
bundler context, which is what plain Node test runs are).

## CI

`.github/workflows/ci.yml` runs on every push/PR to `main`: install,
typecheck, lint, test, build. This is a gate, not just a report — nothing
merges to `main` with a broken build, but note that a **push to `main`
still deploys** (see below) regardless of whether CI has finished, since
Vercel's Git integration and GitHub Actions run independently of each
other. Treat CI passing as a requirement to merge, not as something that
blocks the deploy itself.

## Production

- `npm run build && npm start`, or deploy to Vercel (Git-connected —
  pushing to `main` deploys automatically). `vercel.json` declares one
  cron job (rate-limit table pruning, every 6h); no other config needed.
- Set the environment variables above in the deployment platform's
  dashboard, not from a committed file.
- The admin role cannot be self-assigned via `/register`; promote a user
  to admin directly in the database.

## Database migrations

Migrations live in `prisma/migrations/` and are **not** applied
automatically on deploy — there is no build-step hook running `prisma
migrate deploy`. This is deliberate: a schema change and the code that
depends on it should land in the same reviewed step, not as an
uncontrolled side effect of `next build`.

**To ship a migration:**

1. Write it locally (`npx prisma migrate dev --name <name> --create-only`
   against a dev database, or hand-author the SQL — see existing
   migrations for the pattern this repo uses, including the RLS
   hardening applied to every table).
2. Review the generated SQL. This project runs migrations directly
   against the production Supabase database (`DIRECT_URL`), so there is
   no separate staging environment step here — read the SQL like it's
   about to run for real, because it is.
3. Run `npx prisma migrate deploy` (uses `DIRECT_URL`, the session-mode
   pooler) **before or alongside** deploying the code that depends on the
   new schema — not after. A migration that adds a column a new code path
   reads is safe to run first; one that removes a column old code still
   reads is not (check nothing in the currently-deployed code touches
   what you're dropping).
4. Deploy the code (push to `main`).

**Rollback:** Vercel's dashboard can redeploy any previous deployment
instantly — that reverts the *code*, not the database. There is currently
no automated down-migration path; reverting a bad schema change means
hand-authoring a new forward migration that undoes it (e.g. re-adding a
dropped column) rather than a `prisma migrate down`. Prisma doesn't
generate reverse migrations automatically, so this is a manual step —
budget time for it if a migration goes out that needs undoing, and prefer
additive, backward-compatible migrations (add-then-backfill-then-drop
across separate deploys) over one-shot destructive changes when the
schema change is at all risky.
