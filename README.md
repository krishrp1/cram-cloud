# NoteShare (Cram Cloud)

A full-stack student notes sharing and discussion platform, built as a
single Next.js (App Router) application — one codebase, one Vercel
deployment.

## Features

- Email/password authentication (JWT in an httpOnly cookie, verified server-side, never exposed to client JS)
- Role-based access control (student / admin)
- Semester-scoped PDF notes repository, with per-note comments
- Community discussion forum (threads + replies)
- Admin panel (upload/delete notes, manage users)

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript
- Prisma 7 (`@prisma/adapter-pg`) against Supabase Postgres
- Supabase Storage for PDF files (private bucket, access gated by the app)
- `jose` for session JWTs, `bcryptjs` for password hashing, `zod` for validation
- Tailwind v4 + shadcn/ui

Data access follows one pattern throughout: reads are plain async functions
in `lib/data/*.ts` called directly from Server Components; writes are
Server Actions in `lib/actions/*.ts`. The only Route Handler in the app is
`app/api/pdf/[id]/file/route.ts`, which streams PDF bytes back from
Supabase Storage — everything else is Server Components and Server
Actions. `lib/auth/dal.ts` is the real authorization boundary (re-reads
the user from the DB on every request); `proxy.ts` (Next 16's rename of
`middleware.ts`) only does an optimistic redirect to avoid a flash of
protected content.

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

`.env.local` is gitignored and must never be committed. `JWT_SECRET` must
be a long random value in any deployed environment — the app throws on
startup if it's missing.

## Production

- `npm run build && npm start`, or deploy to Vercel (zero-config — Next.js
  is Vercel's own framework, no custom `vercel.json` needed).
- Set the environment variables above in the deployment platform's
  dashboard, not from a committed file.
- The admin role cannot be self-assigned via `/register`; promote a user
  to admin directly in the database.
